sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (MessageToast, Fragment, Filter, FilterOperator) {
    "use strict";

    var _oLogDialog;
    var _oLogTemplate;

    return {
        // ==========================================
        // 1. TÍNH NĂNG: XÓA PO (Giữ nguyên)
        // ==========================================
// webapp/ext/controller/ListReportExt.js
onRequestDelete: function (oContext, aSelectedContexts) {
            try {
                var oExtensionAPI = this;
                var oEditFlow = oExtensionAPI.getEditFlow();
                
                var aContexts = [];
                var bIsObjectPage = false;

                // 1. NHẬN DIỆN NGỮ CẢNH CỰC KỲ AN TOÀN
                if (aSelectedContexts && aSelectedContexts.length > 0) {
                    // Nếu gọi từ bảng (List Report)
                    aContexts = aSelectedContexts;
                } else if (oContext && typeof oContext.getPath === "function") {
                    // Nếu gọi từ Header của trang chi tiết (Object Page)
                    aContexts = [oContext];
                    bIsObjectPage = true;
                }

                if (aContexts.length === 0) {
                    return sap.m.MessageToast.show("Vui lòng chọn PO để xóa!");
                }

                // KIỂM TRA ĐÂY LÀ NHÁP (DRAFT) HAY THẬT (ACTIVE)
                var targetContext = aContexts[0];
                var bIsDraft = targetContext.getProperty("IsActiveEntity") === false;

                if (bIsDraft) {
                    // ==========================================
                    // TRƯỜNG HỢP 1: DRAFT (Sửa riêng chỗ này)
                    // ==========================================
                    oEditFlow.deleteDocument(targetContext)
                        .then(function() {
                            sap.m.MessageToast.show("Đã hủy bản nháp (Draft) thành công!");
                            
                            // Side Effect cho màn hình chính: Nếu đang ở ngoài List Report thì ép bảng Refresh
                            if (!bIsObjectPage && targetContext.getBinding) {
                                targetContext.getBinding().refresh(); 
                            }
                        })
                        .catch(function(err) {
                            alert("Lỗi khi hủy nháp: " + (err.message || ""));
                        });
                } else {
                    // ==========================================
                    // TRƯỜNG HỢP 2: ACTIVE PO (Giữ nguyên 100% code của bạn)
                    // ==========================================
                    oEditFlow.invokeAction("com.sap.gateway.srvd.zui_purchaseorder.v0001.requestDelete", {
                        contexts: aContexts,
                        skipParameterDialog: false // Hiện popup nhập lý do
                    }).then(function () {
                        sap.m.MessageToast.show("Đã xóa Purchase Order thành công!");
                        
                        // 3. ĐIỀU HƯỚNG CHUẨN V4
                        if (bIsObjectPage) {
                            // NẾU ĐANG Ở TRANG CHI TIẾT -> TRỞ VỀ TRANG TRƯỚC
                            if (oExtensionAPI.getRouting) {
                                oExtensionAPI.getRouting().navigateBack();
                            } else {
                                window.history.back(); // Phương án dự phòng
                            }
                        } else {
                            // NẾU ĐANG Ở BẢNG -> REFRESH BẢNG
                            aContexts[0].getBinding().refresh();
                        }

                    }).catch(function (err) {
                        // Hứng lỗi 404 (Nếu Backend xóa quá nhanh, Fiori không Get lại kịp)
                        var sError = (err.message || "").toLowerCase();
                        if (sError.indexOf("404") !== -1 || sError.indexOf("not found") !== -1 || sError.indexOf("does not exist") !== -1) {
                            sap.m.MessageToast.show("Đã hủy bản nháp thành công!");
                            
                            if (bIsObjectPage) {
                                if (oExtensionAPI.getRouting) {
                                    oExtensionAPI.getRouting().navigateBack();
                                } else {
                                    window.history.back();
                                }
                            } else {
                                aContexts[0].getBinding().refresh();
                            }
                        } else {
                            alert("Lỗi Backend: " + err.message);
                        }
                    });
                }
            } catch (e) {
                // Hiển thị lỗi thẳng lên màn hình thay vì giấu trong Console
                alert("Lỗi giao diện (JS): " + e.message);
            }
        },

        // ==========================================
        // 2. TÍNH NĂNG: XEM LOG CHANGE (Chuẩn Binding)
        // ==========================================
        onViewLog: function (oEvent, aSelectedContexts) {
            try {
                var oExtensionAPI = this;
                var aContexts = aSelectedContexts || []; 
                if (aContexts.length === 0 && oExtensionAPI.getSelectedContexts) { 
                    aContexts = oExtensionAPI.getSelectedContexts(); 
                }

                if (aContexts.length === 0) return MessageToast.show("Vui lòng tick chọn 1 PO!");
                if (aContexts.length > 1) return MessageToast.show("Chỉ chọn 1 PO thôi!");

                var oContext = aContexts[0]; 
                var oModel = oContext.getModel(); 
                var sPoNumber = oContext.getProperty("PoNumber"); 
                
                var that = this; // Giữ lại bối cảnh cho cái nút Đóng

                // 👇 HÀM CỤC BỘ: Nhét thẳng vào đây, không xài "this" nữa, an toàn 100%
                var fnLoadAndOpen = function () {
                    var oLogTable = sap.ui.core.Fragment.byId("logFrag", "jobLogTable");

                    // Gỡ khuôn (Template)
                    if (!_oLogTemplate) {
                        var oBindingInfo = oLogTable.getBindingInfo("items");
                        if (oBindingInfo) {
                            _oLogTemplate = oBindingInfo.template;
                        }
                    }
                    
                    oLogTable.unbindItems(); // Xóa data của PO trước (nếu có)

                    // Tạo bộ lọc
                    var aFilters = [
                        new Filter("PoNumber", FilterOperator.EQ, sPoNumber)
                    ];

                    // Bơm data
                    oLogTable.bindItems({
                        path: "/PoChangeLog", // CHÚ Ý: Đảm bảo đúng tên Entity Set của bạn
                        template: _oLogTemplate,
                        filters: aFilters
                    });

                    _oLogDialog.open();
                };

var oDialogController = {
                    onCloseLogDialog: function () {
                        if (_oLogDialog) {
                            _oLogDialog.close();
                        }
                    }
                };

                // 👇 TRUYỀN MINI CONTROLLER NÀY VÀO LÚC MỞ POP-UP
                if (!_oLogDialog) {
                    Fragment.load({
                        id: "logFrag",
                        name: "capstone.ext.fragment.LogDialog", 
                        controller: oDialogController // <--- THAY ĐỔI Ở ĐÂY: Dùng Mini Controller thay vì 'that'
                    }).then(function (oDialog) {
                        _oLogDialog = oDialog;
                        _oLogDialog.setModel(oModel); 
                        fnLoadAndOpen(); 
                    });
                } else {
                    fnLoadAndOpen(); 
                }

            } catch (e) {
                alert("Lỗi JS: " + e.message);
            }
        },

        // ==========================================
        // 3. ĐÓNG POP-UP LẠI 
        // ==========================================
        onCloseLogDialog: function () {
            if (_oLogDialog) {
                _oLogDialog.close();
            }
        }
    };
});
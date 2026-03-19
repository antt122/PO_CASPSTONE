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
onRequestDelete: function (oEventOrContext, aSelectedContexts) {
    var oExtensionAPI = this;
    
    // 1. XÁC ĐỊNH NGỮ CẢNH THÔNG MINH (Bao trọn mọi trường hợp)
    var aContexts = [];
    var bIsObjectPage = false; // Cờ nhận biết đang ở trang chi tiết

    if (aSelectedContexts && aSelectedContexts.length > 0) {
        aContexts = aSelectedContexts; // Gọi từ List Report
    } else if (oEventOrContext && typeof oEventOrContext.getSource === "function") {
        var oContext = oEventOrContext.getSource().getBindingContext();
        if (oContext) {
            aContexts = [oContext]; // Gọi từ Header (Trang chi tiết)
            bIsObjectPage = true;
        }
    } else if (oEventOrContext && typeof oEventOrContext.getPath === "function") {
        aContexts = [oEventOrContext]; // Fallback
        bIsObjectPage = true;
    }

    if (aContexts.length === 0) {
        return sap.m.MessageToast.show("Vui lòng chọn PO để xóa!");
    }

    // 2. GỌI ACTION XUỐNG BACKEND
    var oEditFlow = oExtensionAPI.getEditFlow ? oExtensionAPI.getEditFlow() : oExtensionAPI.editFlow;
    
    oEditFlow.invokeAction("com.sap.gateway.srvd.zui_purchaseorder.v0001.requestDelete", {
        contexts: aContexts,
        skipParameterDialog: false // Hiện popup nhập lý do
    }).then(function () {
        sap.m.MessageToast.show("Đã xóa Purchase Order thành công!");
        
        // 👇 KHÚC QUAN TRỌNG NHẤT LÀ ĐÂY 👇
        if (bIsObjectPage) {
            // Nếu xóa thành công từ trang chi tiết -> Lập tức lùi lại 1 trang
            window.history.back(); 
        } else {
            // Nếu xóa từ bảng -> Chỉ refresh lại bảng
            aContexts[0].getBinding().refresh();
        }

    }).catch(function (err) {
        var sError = (err.message || "").toLowerCase();
        
        // Hứng lỗi 404 (Nếu Backend xóa nhanh quá Fiori không lấy kịp)
        if (sError.includes("404") || sError.includes("not found")) {
             sap.m.MessageToast.show("Đã hủy bản nháp thành công!");
             if (bIsObjectPage) window.history.back();
        } else {
             sap.m.MessageBox.error(err.message || "Lỗi xử lý từ hệ thống.");
        }
    });
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
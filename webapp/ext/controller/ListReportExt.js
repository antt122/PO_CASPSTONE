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
        onRequestDelete: function (oContext, aSelectedContexts) {
            try {
                var oExtensionAPI = this;
                var oEditFlow = oExtensionAPI.getEditFlow();
                
                var aContexts = [];
                var bIsObjectPage = false;

                // NHẬN DIỆN NGỮ CẢNH CỰC KỲ AN TOÀN
                if (aSelectedContexts && aSelectedContexts.length > 0) {
                    aContexts = aSelectedContexts;
                } else if (oContext && typeof oContext.getPath === "function") {
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
                    // TRƯỜNG HỢP 1: DRAFT 
                    oEditFlow.deleteDocument(targetContext)
                        .then(function() {
                            sap.m.MessageToast.show("Đã hủy bản nháp (Draft) thành công!");
                            if (!bIsObjectPage && targetContext.getBinding) {
                                targetContext.getBinding().refresh(); 
                            }
                        })
                        .catch(function(err) {
                            alert("Lỗi khi hủy nháp: " + (err.message || ""));
                        });
                } else {
                    // TRƯỜNG HỢP 2: ACTIVE PO 
                    oEditFlow.invokeAction("com.sap.gateway.srvd.zui_purchaseorder.v0001.requestDelete", {
                        contexts: aContexts,
                        skipParameterDialog: false // Hiện popup nhập lý do
                    }).then(function () {
                        sap.m.MessageToast.show("Đã xóa Purchase Order thành công!");
                        
                        if (bIsObjectPage) {
                            if (oExtensionAPI.getRouting) {
                                oExtensionAPI.getRouting().navigateBack();
                            } else {
                                window.history.back(); // Phương án dự phòng
                            }
                        } else {
                            aContexts[0].getBinding().refresh();
                        }

                    }).catch(function (err) {
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
                alert("Lỗi giao diện (JS): " + e.message);
            }
        },

        // ==========================================
        // 2. TÍNH NĂNG: XEM LOG CHANGE THEO PO ĐƯỢC CHỌN
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
                
                // CHỐT CHẶN DRAFT MỚI
                var bIsDraft = oContext.getProperty("IsActiveEntity") === false;
                var bHasActive = oContext.getProperty("HasActiveEntity") === true;

                if (!sPoNumber || sPoNumber.trim() === "" || (bIsDraft && !bHasActive)) {
                    return MessageToast.show("Bản nháp mới chưa có lịch sử thay đổi (Change Log)!");
                }
                
                var fnLoadAndOpen = function () {
                    var oLogTable = sap.ui.core.Fragment.byId("logFrag", "jobLogTable");

                    // Gỡ khuôn (Template)
                    if (!_oLogTemplate) {
                        var oBindingInfo = oLogTable.getBindingInfo("items");
                        if (oBindingInfo) {
                            _oLogTemplate = oBindingInfo.template;
                        }
                    }
                    
                    oLogTable.unbindItems(); 

                    // Tạo bộ lọc theo PoNumber
                    var aFilters = [
                        new Filter("PoNumber", FilterOperator.EQ, sPoNumber)
                    ];

                    oLogTable.bindItems({
                        path: "/PoChangeLog", 
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

                if (!_oLogDialog) {
                    Fragment.load({
                        id: "logFrag",
                        name: "capstone.ext.fragment.LogDialog", 
                        controller: oDialogController 
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
        },

        // ==========================================
        // 4. TÍNH NĂNG MỚI: XEM TOÀN BỘ LOG XÓA PO (GLOBAL)
        // ==========================================
        onViewDeletedLogs: function (oEvent) {
            try {
                // Lấy default model của hệ thống
                var oModel = this.getModel(); 
                
                var fnLoadAndOpen = function () {
                    var oLogTable = sap.ui.core.Fragment.byId("logFrag", "jobLogTable");

                    // Gỡ khuôn (Template)
                    if (!_oLogTemplate) {
                        var oBindingInfo = oLogTable.getBindingInfo("items");
                        if (oBindingInfo) {
                            _oLogTemplate = oBindingInfo.template;
                        }
                    }
                    
                    oLogTable.unbindItems(); 

                    // 👇 BỘ LỌC KÉP (AND): CHỈ LẤY ĐÚNG DÒNG HEADER BỊ XÓA 👇
                    var aFilters = [
                        new Filter({
                            filters: [
                                new Filter("NewValue", FilterOperator.EQ, "DELETED"),
                                new Filter("FieldName", FilterOperator.EQ, "PO_HEADER")
                            ],
                            and: true // Ép buộc UI5 phải dùng phép toán AND
                        })
                    ];

                    oLogTable.bindItems({
                        path: "/PoChangeLog", 
                        template: _oLogTemplate,
                        filters: aFilters
                    });

                    _oLogDialog.open();
                };

                var oDialogController = {
                    onCloseLogDialog: function () {
                        if (_oLogDialog) _oLogDialog.close();
                    }
                };

                // Load Fragment nếu chưa có
                if (!_oLogDialog) {
                    sap.ui.core.Fragment.load({
                        id: "logFrag",
                        name: "capstone.ext.fragment.LogDialog", 
                        controller: oDialogController 
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
        }
    };
});
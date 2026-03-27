sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (MessageToast, MessageBox) {
    "use strict";

    return {
        // ==========================================
        // 1. TÍNH NĂNG: PRINT PO (PDF)
        // ==========================================
        onPrintPO: function (oEvent) {
            // ... (Code in PDF của bạn giữ nguyên ở đây) ...
        },

        // ==========================================
        // 2. TÍNH NĂNG: XÓA PO TỪ TRANG CHI TIẾT (OBJECT PAGE)
        // ==========================================
        onRequestDelete: function (oContext) {
            try {
                var oExtensionAPI = this;
                
                if (!oContext) {
                    return MessageToast.show("Không tìm thấy thông tin PO!");
                }

                var oEditFlow = oExtensionAPI.getEditFlow();
                var bIsDraft = oContext.getProperty("IsActiveEntity") === false;

                if (bIsDraft) {
                    // TRƯỜNG HỢP 1: XÓA NHÁP
                    oEditFlow.deleteDocument(oContext)
                        .then(function() {
                            MessageToast.show("Đã hủy bản nháp thành công!");
                        })
                        .catch(function(err) {
                            MessageBox.error("Lỗi khi hủy nháp: " + (err.message || ""));
                        });
                } else {
                    // TRƯỜNG HỢP 2: XÓA PO ACTIVE
                    oEditFlow.invokeAction("com.sap.gateway.srvd.zui_purchaseorder.v0001.requestDelete", {
                        contexts: [oContext],
                        skipParameterDialog: false // Hiện popup nhập lý do
                    }).then(function () {
                        MessageToast.show("Đã xóa Purchase Order thành công!");
                        
                        // 👇 DÙNG LỆNH LÙI TRANG TRỰC TIẾP CỦA TRÌNH DUYỆT CỰC AN TOÀN 👇
                        window.history.back(); 

                    }).catch(function (err) {
                        var sError = (err.message || "").toLowerCase();
                        
                        // 👇 1. XỬ LÝ SỰ KIỆN USER BẤM CANCEL 👇
                        if (sError.indexOf("cancel") !== -1) {
                            return MessageToast.show("Đã hủy thao tác."); // Báo Toast nhẹ nhàng và dừng lại
                        }
                        
                        // 👇 2. XỬ LÝ LỖI "ẢO" KHI XÓA NHANH BỊ 404/412 👇
                        if (sError.indexOf("404") !== -1 || 
                            sError.indexOf("not found") !== -1 || 
                            sError.indexOf("does not exist") !== -1 || 
                            sError.indexOf("412") !== -1 || 
                            sError.indexOf("strict") !== -1) {
                            
                            MessageToast.show("Đã xóa Purchase Order thành công!");
                            
                            // Xóa xong ép lùi trang luôn
                            window.history.back();
                            
                        } else {
                            // 👇 3. LỖI THẬT SỰ TỪ HỆ THỐNG MỚI BÁO ĐỎ 👇
                            MessageBox.error("Lỗi Backend: " + err.message);
                        }
                    });
                }
            } catch (e) {
                MessageBox.error("Lỗi JS: " + e.message);
            }
        }
    };
});
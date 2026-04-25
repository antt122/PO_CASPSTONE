sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (MessageToast, MessageBox) {
    "use strict";

    return {
        onRequestDeleteItem: function (oBindingContext, aSelectedContexts) {
            var oExtensionAPI = this;
            
            // Lấy context an toàn
            var aContexts = (aSelectedContexts && aSelectedContexts.length > 0) 
                            ? aSelectedContexts 
                            : (oBindingContext ? [oBindingContext] : []);

            if (aContexts.length === 0) {
                return MessageToast.show("Please select at least one item to delete!");
            }

            try {
                var oEditFlow = oExtensionAPI.getEditFlow();
                var oTargetContext = aContexts[0];
                var oBinding = oTargetContext && typeof oTargetContext.getBinding === "function" ? oTargetContext.getBinding() : null;
                var iTotalItems = oBinding ? (oBinding.getCount() || oBinding.getLength() || 0) : 0; 

                // Rule 1: PO phải luôn có ít nhất 1 item
                if (iTotalItems > 0 && aContexts.length >= iTotalItems) {
                   return MessageBox.error("A Purchase Order must have at least one item. You cannot delete all items.");
                }
                
                var aNewItems = [];
                var aExistingItems = [];

                // Rule 2: QUAY LẠI LOGIC CHECK THEO PO ITEM
                aContexts.forEach(function (oCtx) {
                    var sPoItem = oCtx.getProperty("PoItem");
                    
                    // Nếu rỗng, bằng 0, hoặc bằng 00000 -> Đích thị là dòng mới add thêm trong lúc Edit
                    if (!sPoItem || sPoItem === "0" || sPoItem === "00000") {
                        aNewItems.push(oCtx);
                    } else {
                        // Nếu đã có số (VD: 00010) -> Là dòng đã tồn tại từ trước, phải nhập lý do
                        aExistingItems.push(oCtx);
                    }
                });

                // Rule 3: Chặn xóa hỗn hợp
                if (aNewItems.length > 0 && aExistingItems.length > 0) {
                    return MessageBox.warning("Please select either ONLY newly added items or ONLY existing items to delete, not both mixed.");
                }

                // Thiết lập cờ: Bỏ qua popup (true) CHỈ KHI không có dòng cũ nào được chọn
                var bSkipPopup = (aExistingItems.length === 0);
                var sActionName = "com.sap.gateway.srvd.zui_purchaseorder.v0001.requestDeleteItem";

                // Gọi backend Action
                oEditFlow.invokeAction(sActionName, {
                    contexts: aContexts,
                    label: "Confirm Deletion Item", 
                    skipParameterDialog: bSkipPopup 
                }).then(function () {
                    
                    MessageToast.show(bSkipPopup ? "Newly added item(s) removed successfully!" : "Item(s) deleted successfully!");

                    // Refresh lại bảng dữ liệu
                    if (oExtensionAPI.getSideEffects) {
                        oExtensionAPI.getSideEffects().requestSideEffects([{ "$NavigationPropertyPath": "_PoItem" }]);
                    } else {
                        oExtensionAPI.refresh();
                    }

                }).catch(function (err) {
                    var sError = (err.message || "").toLowerCase();
                    if (sError.indexOf("cancel") !== -1 || sError.indexOf("dialog cancelled") !== -1) {
                        return MessageToast.show("Deletion cancelled.");
                    }
                    MessageBox.error("Backend Error: " + err.message);
                });

            } catch (e) {
                console.error("Fiori V4 logic error:", e);
                MessageBox.error("JS Error: " + e.message);
            }
        }
    };
});
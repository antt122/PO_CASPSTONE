sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    return {
        // TRONG V4: Tham số 1 là oBindingContext, Tham số 2 là aSelectedContexts
        onRequestDeleteItem: function (oBindingContext, aSelectedContexts) {
            // 'this' trong Action Handler của V4 chính là ExtensionAPI
            var oExtensionAPI = this; 
            
            // aSelectedContexts chính là mảng các dòng bạn đã tick chọn
            var aContexts = aSelectedContexts || [];

            if (aContexts.length === 0) {
                MessageToast.show("Vui lòng chọn ít nhất 1 Item để xóa.");
                return;
            }

            try {
                var oEditFlow = oExtensionAPI.getEditFlow();
                
                // Tên Action phải khớp 100% với file metadata.xml
                var sActionName = "com.sap.gateway.srvd.zui_purchaseorder.v0001.requestDeleteItem";

                // Gọi Action thực thi xóa ở Backend
                oEditFlow.invokeAction(sActionName, {
                    contexts: aContexts,
                    skipParameterDialog: false // Hiện popup nhập lý do
                }).then(function () {
    MessageToast.show("Đã xóa Item thành công!");

    // CÁCH CHUẨN V4: Gọi Side Effects thay vì refresh binding thủ công
    if (oExtensionAPI.getSideEffects) {
        oExtensionAPI.getSideEffects().requestSideEffects([
            {
                // Bảo framework load lại cái Association _PoItem
                "$NavigationPropertyPath": "_PoItem"
            }
        ]);
    } else {
        // Nếu trường hợp xấu nhất không gọi được SideEffects, 
        // dùng "đại chiêu" refresh toàn trang (Object Page)
        oExtensionAPI.refresh();
    }

}).catch(function (err) {
    console.error("Lỗi thực thi Action:", err);
});
            } catch (e) {
                console.error("Lỗi logic Fiori V4:", e);
            }
        }
    };
});
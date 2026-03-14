sap.ui.define(['sap/ui/core/mvc/ControllerExtension'], function (ControllerExtension) {
    'use strict';

    return ControllerExtension.extend('capstone.ext.controller.ItemCalculation', {

        // 1. KHI NGƯỜI DÙNG SỬA SỐ LƯỢNG (Quantity)
        onQuantityChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var oContext = oInput.getBindingContext();

            // A. Lấy Số lượng MỚI từ ô Input (Cái user vừa gõ)
            var nNewQuantity = this._parseValue(oInput);

            // B. Lấy Đơn giá CŨ từ Model (Cái đang có sẵn)
            var nOldPrice = parseFloat(oContext.getProperty("NetPrice")) || 0;

            // C. Tính toán
            this._updateTotal(oContext, nNewQuantity, nOldPrice);
        },

        // 2. KHI NGƯỜI DÙNG SỬA ĐƠN GIÁ (NetPrice)
        onPriceChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var oContext = oInput.getBindingContext();

            // A. Lấy Đơn giá MỚI từ ô Input (Cái user vừa gõ)
            var nNewPrice = this._parseValue(oInput);

            // B. Lấy Số lượng CŨ từ Model (Cái đang có sẵn)
            var nOldQuantity = parseFloat(oContext.getProperty("Quantity")) || 0;

            // C. Tính toán
            this._updateTotal(oContext, nOldQuantity, nNewPrice);
        },

        // --- HÀM TÍNH TOÁN & CẬP NHẬT ---
        _updateTotal: function (oContext, nQuantity, nPrice) {
            var nTotal = nQuantity * nPrice;

            // Kiểm tra log (F12) để xem nó nhân đúng chưa
            console.log("Calculated: " + nQuantity + " * " + nPrice + " = " + nTotal);

            // Cập nhật kết quả vào cột Net Amount
            oContext.setProperty("NetAmount", nTotal.toString());
        },

        // --- HÀM HỖ TRỢ ĐỌC SỐ TỪ INPUT (Quan trọng) ---
        // Hàm này giúp xử lý dấu phẩy/chấm (VD: 1.200 hay 1,200)
        _parseValue: function (oInput) {
            var sValue = oInput.getValue();
            try {
                // Cách 1: Dùng Parser chuẩn của SAP (Xử lý tốt dấu phẩy/chấm theo User Settings)
                var oType = oInput.getBinding("value").getType();
                if (oType && oType.parseValue) {
                    return oType.parseValue(sValue, "string");
                } 
                // Cách 2: Fallback (Nếu không có Type) - Xử lý thô
                else {
                    // Nếu số có dấu phẩy (1,200), replace nó đi để JS hiểu
                    return parseFloat(sValue.replace(/,/g, "")) || 0;
                }
            } catch (e) {
                return parseFloat(sValue) || 0;
            }
        }
    });
});
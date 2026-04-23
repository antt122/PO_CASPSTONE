sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension", 
    "sap/m/MessageBox"           
], function (ControllerExtension, MessageBox) { 
    "use strict";

    return ControllerExtension.extend("capstone.ext.controller.ObjectPageExt", {
        override: {
            editFlow: {
                onBeforeSave: function () {
                    var oContext = this.getView().getBindingContext();
                    var dDeliveryDate = oContext.getProperty("DeliveryDate");

                    if (dDeliveryDate) {
                        var dToday = new Date();
                        dToday.setHours(0, 0, 0, 0); 
                        
                        var dSelected = new Date(dDeliveryDate);
                        dSelected.setHours(0, 0, 0, 0);

                        if (dSelected < dToday) {
                            MessageBox.error("Delivery date cannot be in the past. Please correct it!");
                            return Promise.reject(); 
                        }
                    }
                    return Promise.resolve();
                }
            }
        }
    });
});
sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"capstone/test/integration/pages/PurchaseOrderList",
	"capstone/test/integration/pages/PurchaseOrderObjectPage"
], function (JourneyRunner, PurchaseOrderList, PurchaseOrderObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('capstone') + '/test/flp.html#app-preview',
        pages: {
			onThePurchaseOrderList: PurchaseOrderList,
			onThePurchaseOrderObjectPage: PurchaseOrderObjectPage
        },
        async: true
    });

    return runner;
});


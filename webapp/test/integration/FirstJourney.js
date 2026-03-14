sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/JourneyRunner"
], function (opaTest, runner) {
    "use strict";

    function journey() {
        QUnit.module("First journey");

        opaTest("Start application", function (Given, When, Then) {
            Given.iStartMyApp();

            Then.onThePurchaseOrderList.iSeeThisPage();
            Then.onThePurchaseOrderList.onFilterBar().iCheckFilterField("Purchasing Document");
            Then.onThePurchaseOrderList.onFilterBar().iCheckFilterField("Purchasing Doc. Type");
            Then.onThePurchaseOrderList.onFilterBar().iCheckFilterField("Supplier");
            Then.onThePurchaseOrderList.onFilterBar().iCheckFilterField("Company Code");
            Then.onThePurchaseOrderList.onFilterBar().iCheckFilterField("Purch. Organization");
            Then.onThePurchaseOrderList.onTable().iCheckColumns(7, {"PoNumber":{"header":"PO Number"},"PoType":{"header":"Type"},"Supplier":{"header":"Supplier"},"CompanyCode":{"header":"Company Code"},"PurchGroup":{"header":"Purchasing Group"},"PoDate":{"header":"PO Date"},"ProcessingStatus":{"header":"Proc. State"}});

        });


        opaTest("Navigate to ObjectPage", function (Given, When, Then) {
            // Note: this test will fail if the ListReport page doesn't show any data
            
            When.onThePurchaseOrderList.onFilterBar().iExecuteSearch();
            
            Then.onThePurchaseOrderList.onTable().iCheckRows();

            When.onThePurchaseOrderList.onTable().iPressRow(0);
            Then.onThePurchaseOrderObjectPage.iSeeThisPage();

        });

        opaTest("Teardown", function (Given, When, Then) { 
            // Cleanup
            Given.iTearDownMyApp();
        });
    }

    runner.run([journey]);
});
/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
  "sap/m/MessageBox",
  "sap/cdp/ums/managerequests/utils/config"
], function(MessageBox,Config) {
  "use strict";
  var Mappings = {
    /**
     * Mapping the Draft Request results with the UI json
     * @param  {Object} oData Payload read from backend
     * @return {Object}  oRequest     Mapped Request Data
     */
    mapDraftRequestEmployees: function(oData) {
      var oEmployee = {};
      var oEntitlement = {};
      var aEmployees = [];
      var aEmployeeEntitlements = [];      
      var NoofEntitlements = 0;
      var aRespEntitlements = [];
      var i = 0;
      var j = 0;
      var aEmpNoEntitlements = [];
      var oRequestId = oData.RequestId;
      var oRequest = {};
      var NoOfItemSizes = 0;
      var aRespItemSizes = [];
      var oItemSize = {};
      var aItemSizes = [];

      // Map the Request level Details
      oRequest.RequestId = oData.RequestId;
      oRequest.CategoryId = oData.CategoryId;
      oRequest.TypeId = oData.TypeId;
      oRequest.Approver = oData.Approver;
      oRequest.EventCodeId = oData.EventCodeId;
      oRequest.SetcodeId = oData.SetcodeId;
      oRequest.CostcenterId = oData.CostcenterId;
      oRequest.Vendor = oData.Vendor;
      oRequest.PlantId = oData.PlantId;
      oRequest.PositionClassification = oData.PositionClassification;
      oRequest.HeaderText = oData.HeaderText;
      oRequest.MaxAllowedEmp = oData.MaxAllowedEmp;


      if (!oData.RequestEmployees.results || oData.RequestEmployees.results.constructor !== Array ||
        oData.RequestEmployees.length <= 0) {
        jQuery.sap.log.error('Employees for the Request not found');
        return null;
      }

      oData.RequestEmployees.results.forEach(function(oRequestEmployee) {
        NoofEntitlements = oRequestEmployee.RequestEmployeeEntitlements.results.length;
        if (NoofEntitlements <= 0) {
          aEmpNoEntitlements.push({
            Name: oRequestEmployee.Name,
            EmpId: oRequestEmployee.EmployeeId
          });
          return null;
        }

        oEmployee.RequestId = oRequestId;

        oEmployee.EmployeeId = oRequestEmployee.EmployeeId;
        oEmployee.Name = oRequestEmployee.Name;
        oEmployee.ApproverId = oRequestEmployee.ApproverId;
        oEmployee.Approver = oRequestEmployee.Approver;
        oEmployee.Attachments = oRequestEmployee.Attachments;
        aRespEntitlements = oRequestEmployee.RequestEmployeeEntitlements.results;

        for (var i = 0; i < NoofEntitlements; i++) {

          oEntitlement.RequestId = oEmployee.RequestId;
          oEntitlement.EmployeeId = oEmployee.EmployeeId;
          oEntitlement.Item = aRespEntitlements[i].Item;
          oEntitlement.ItemId = aRespEntitlements[i].ItemId;
          //assigning the exisitn item to the new item id as per agreement with the backend
        // that the newitemid woudl be always filled with item id bu in the exchange scenario
        // itemid and new itemid would be different
        // the exchange scenario, it would be initiated from the front end.
          oEntitlement.NewItemId = aRespEntitlements[i].ItemId;
          oEntitlement.ItemPos = aRespEntitlements[i].ItemPos;
          oEntitlement.ItemType = aRespEntitlements[i].ItemType;
          oEntitlement.Size = aRespEntitlements[i].Size;
          oEntitlement.SetcodeId = aRespEntitlements[i].SetcodeId;
          oEntitlement.EntitledQuantity = aRespEntitlements[i].EntitledQuantity;
          oEntitlement.RemainingQuantity = aRespEntitlements[i].RemainingQuantity;
          oEntitlement.PickedQuantity = aRespEntitlements[i].PickedQuantity;
          oEntitlement.OrderQuantity = aRespEntitlements[i].OrderQuantity;
          oEntitlement.InstockQuantity = aRespEntitlements[i].InstockQuantity;
          oEntitlement.IsReadOnly = aRespEntitlements[i].IsReadOnly;
          oEntitlement.SizeRelevant = aRespEntitlements[i].SizeRelevant;

          // Transfer thePrice to be shown only for Purchase Request
          oEntitlement.Price = aRespEntitlements[i].Price;
          oEntitlement.Currency = aRespEntitlements[i].Currency;

          // Map the Item Sizes data
          NoOfItemSizes = aRespEntitlements[i].ItemSizes.results.length;
          aRespItemSizes = aRespEntitlements[i].ItemSizes.results;
          for (var j = 0; j < NoOfItemSizes; j++) {
            // Map the Item Sizes Level Data
            oItemSize.RequestId = aRespItemSizes[j].RequestId;
            oItemSize.ItemId = aRespItemSizes[j].ItemId;
            oItemSize.ItemType = aRespItemSizes[j].ItemType;
            oItemSize.ItemPos = aRespItemSizes[j].ItemPos;
            oItemSize.Size = aRespItemSizes[j].Size;
            oItemSize.SizeUnit = aRespItemSizes[j].SizeUnit;
            oItemSize.SizeDesc = aRespItemSizes[j].SizeDesc;
            oItemSize.Item = aRespItemSizes[j].Item;
            oItemSize.InstockQuantity = aRespItemSizes[j].InstockQuantity;
            // On change of Item size - price and currency should also change
            oItemSize.Price   = aRespItemSizes[j].Price;
            oItemSize.Currency =  aRespItemSizes[j].Currency;
            aItemSizes.push(oItemSize);
            oItemSize = {};
          }
          oEntitlement.ItemSizes = aItemSizes;
          aEmployeeEntitlements.push(oEntitlement);
          oEntitlement = {};
          aItemSizes = [];
        }

        oEmployee.RequestEmployeeEntitlements = aEmployeeEntitlements;        
        aEmployees.push(oEmployee);
        aEmployeeEntitlements = [];
        oEmployee = {};
      });

      if (aEmpNoEntitlements.length > 0) {
        MessageBox.show("Entitlements not recieved, please check the message logs for details", {
          title: "Entitlements not found"
        });
      }
      // Accumulate Request Details with the Employee Details and return
      oRequest.RequestEmployees = aEmployees;
      return oRequest;
    },

    /**
     * Sanitize and map the employee  and the his entitlements for display
     * UI
     * @param  {Object} oData oResponse to be sanitized
     * @param {String} sRequestId Request ID in string
     * @return {Array}  array of the employee with their entitlements
     */
    mapEmpEntitlements: function(oData, sReqeustId) {
      var oEmployee = {};
      var oEntitlement = {};
      var aEmployees = [];
      var aEmployeeEntitlements = [];
      var NoofEntitlements = 0;
      var aRespEntitlements = [];
      var i = 0;
      var j = 0;
      var oRequestId = sReqeustId;
      var aEmpNoEntitlements = [];
      var NoOfItemSizes = 0;
      var aRespItemSizes = [];
      var oItemSize = {};
      var aItemSizes = [];

      oData.__batchResponses.forEach(function(oResponse) {
        if (!oResponse.data) {
          jQuery.sap.log.error("No data recieved from backend");
          return null;
        }
        if (!oResponse.data.EmployeeEntitlements) {
          aEmpNoEntitlements.push({
            Name: oResponse.data.Name,
            EmpId: oResponse.data.EmployeeId
          });
          return null;
        }
        NoofEntitlements = oResponse.data.EmployeeEntitlements.results.length;

        oEmployee.RequestId = oRequestId;
        oEmployee.Approver = oResponse.data.Approver;
        oEmployee.ApproverId = oResponse.data.ApproverId;
        oEmployee.EmployeeId = oResponse.data.EmployeeId;
        oEmployee.Name = oResponse.data.Name;
        oEmployee.MaxAllowedEmp = oResponse.data.MaxAllowedEmp;

        aRespEntitlements = oResponse.data.EmployeeEntitlements.results;

        for (var i = 0; i < NoofEntitlements; i++) {

          //set the setcode at header leavel

          oEntitlement.RequestId = oEmployee.RequestId;
          oEntitlement.EmployeeId = oEmployee.EmployeeId;
          oEntitlement.Item = aRespEntitlements[i].Item;
          oEntitlement.ItemId = aRespEntitlements[i].ItemId;
        //assigning the exisitn item to the new item id as per agreement with the backend
        // that the newitemid woudl be always filled with item id bu in the exchange scenario
        // itemid and new itemid would be different
        // the exchange scenario, it would be initiated from the front end.
          oEntitlement.NewItemId = aRespEntitlements[i].ItemId;
          oEntitlement.ItemPos = aRespEntitlements[i].ItemPos;
          oEntitlement.ItemType = aRespEntitlements[i].ItemType;
          oEntitlement.Size = aRespEntitlements[i].Size;
          oEntitlement.SetcodeId = aRespEntitlements[i].SetcodeId;
          oEntitlement.EntitledQuantity = aRespEntitlements[i].EntitledQuantity;
          oEntitlement.RemainingQuantity = aRespEntitlements[i].RemainingQuantity;
          oEntitlement.PickedQuantity = aRespEntitlements[i].PickedQuantity;
          oEntitlement.OrderQuantity = aRespEntitlements[i].OrderQuantity;
          oEntitlement.InstockQuantity = aRespEntitlements[i].InstockQuantity;
          oEntitlement.TypeId = aRespEntitlements[i].TypeId;
          oEntitlement.IsReadOnly = aRespEntitlements[i].IsReadOnly;
          oEntitlement.SizeRelevant = aRespEntitlements[i].SizeRelevant;
          oEntitlement.Price = aRespEntitlements[i].Price;
          oEntitlement.Currency = aRespEntitlements[i].Currency;
          // Map the Item Sizes data
          NoOfItemSizes = aRespEntitlements[i].ItemSizes.results.length;
          aRespItemSizes = aRespEntitlements[i].ItemSizes.results;
          for (var j = 0; j < NoOfItemSizes; j++) {
            // Map the Item Sizes Level Data
            oItemSize.RequestId = aRespItemSizes[j].RequestId;
            oItemSize.ItemId = aRespItemSizes[j].ItemId;
            oItemSize.ItemType = aRespItemSizes[j].ItemType;
            oItemSize.ItemPos = aRespItemSizes[j].ItemPos;
            oItemSize.Size = aRespItemSizes[j].Size;
            oItemSize.SizeUnit = aRespItemSizes[j].SizeUnit;
            oItemSize.SizeDesc = aRespItemSizes[j].SizeDesc;
            oItemSize.Item = aRespItemSizes[j].Item;
            oItemSize.InstockQuantity = aRespItemSizes[j].InstockQuantity;
            // On change of Item size - price and currency should also change
            oItemSize.Price   = aRespItemSizes[j].Price;
            oItemSize.Currency =  aRespItemSizes[j].Currency;
            aItemSizes.push(oItemSize);
            oItemSize = {};
          }
          oEntitlement.ItemSizes = aItemSizes;
          aEmployeeEntitlements.push(oEntitlement);
          oEntitlement = {};
          aItemSizes = [];
        }

        oEmployee.RequestEmployeeEntitlements = aEmployeeEntitlements; 

        aEmployees.push(oEmployee);
        aEmployeeEntitlements = [];
        oEmployee = {};

      });

      if (aEmpNoEntitlements.length > 0) {
        MessageBox.show("Entitlements not recieved, please check the message logs for details", {
          title: "Entitlements not found"
        });
      }
      return aEmployees;
    },

    /**
     * Map the Data from OData Model to JSON Model     
     * @param {object} OData The object containing data     
     * @return {Object}  oRequest     Mapped Request Data
     */
    mapDataToRequest: function(oData) {
      var oRequest = {};
      var oRequestItem = {};
      var oItemSize = {};
      var oAlterationItem = {};
      var oStorageLocation = {};

      var aRequestItems = [];
      var aItemSizes = [];
      var aAlterationItems = [];
      var aStorageLocations = [];
      var aUsedStorageLocations = [];
      var aUnusedStorageLocations = [];


      var NoOfRequestItems = 0;
      var NoOfItemSizes = 0;
      var NoOfAlterationItems = 0;
      var NoOfStorageLocations = 0;

      var aRespRequestItems = [];
      var aRespItemSizes = [];
      var aRespAlterationItems = [];
      var aRespStorageLocations = [];

      // Start mapping the attributes from OData to JOSN Model

      // Map the Request Level Data
      oRequest.RequestId = oData.RequestId;
      oRequest.EventCodeId = oData.EventCodeId;
      oRequest.CategoryId = oData.CategoryId;
      oRequest.Category = oData.Category;
      oRequest.ApproverId = oData.ApproverId;
      oRequest.ApproverName = oData.ApproverName;
      oRequest.TypeId = oData.TypeId;
      oRequest.Type = oData.Type;
      oRequest.ForId = oData.ForId;
      oRequest.For = oData.For;
      oRequest.Department = oData.Department;
      oRequest.Gender = oData.Gender;
      oRequest.Position = oData.Position;
      oRequest.Location = oData.Location;
      oRequest.CreatedOn = oData.CreatedOn;
      oRequest.FinalSettlement = oData.FinalSettlement;
      oRequest.Editable = oData.Editable;
      oRequest.RequesterId = oData.RequesterId;
      oRequest.Requester = oData.Requester;
      oRequest.ReceiverId = oData.ReceiverId;
      oRequest.Receiver = oData.Receiver;
      oRequest.StatusId = oData.StatusId;
      oRequest.Status = oData.Status;
      oRequest.CostcenterId = oData.CostcenterId;
      oRequest.TotalIssueReturn = oData.TotalIssueReturn;
      oRequest.TotalIssuedReturned = oData.TotalIssuedReturned;
      oRequest.QuantityUnit = oData.QuantityUnit;
      oRequest.Action = oData.Action;
      // Flag to indicate whether the Request is Printable or not
      oRequest.IsPrintable = oData.IsPrintable;
      oRequest.HeaderText = ""; // since the json model is bound to the new entry text
      oRequest.SignatureData = "";
        // Get the number of Items in this Request
      oRequest.AttachmentCount = oData.AttachmentCount;

      NoOfRequestItems = oData.RequestItems.results.length;

      aRespRequestItems = oData.RequestItems.results;

      for (var i = 0; i < NoOfRequestItems; i++) {

        oRequest.SetcodeId = aRespRequestItems[i].SetcodeId;
        // Map the Request Item Level Data
        oRequestItem.RequestId = oRequest.RequestId;
        oRequestItem.SetcodeId = aRespRequestItems[i].SetcodeId;
        oRequestItem.ItemId = aRespRequestItems[i].ItemId;
        //assigning the exisitn item to the new item id as per agreement with the backend
        // that the newitemid woudl be always filled with item id bu in the exchange scenario
        // itemid and new itemid would be different
        // the exchange scenario, it would be initiated from the front end.
        oRequestItem.NewItemId = aRespRequestItems[i].ItemId;
        oRequestItem.ItemPos = aRespRequestItems[i].ItemPos;
        oRequestItem.ItemType = aRespRequestItems[i].ItemType;
        oRequestItem.Item = aRespRequestItems[i].Item;
        oRequestItem.For = aRespRequestItems[i].For;
        oRequestItem.EntitledQuantity = aRespRequestItems[i].EntitledQuantity;
        oRequestItem.OrderQuantity = aRespRequestItems[i].OrderQuantity;
        oRequestItem.PickedQuantity = aRespRequestItems[i].PickedQuantity;
        oRequestItem.InstockQuantity = aRespRequestItems[i].InstockQuantity;
        oRequestItem.RemainingQuantity = aRespRequestItems[i].RemainingQuantity;

        oRequestItem.PickupQuantity = aRespRequestItems[i].PickupQuantity;
        oRequestItem.ExchangeQuantity = aRespRequestItems[i].ExchangeQuantity;
        oRequestItem.AlterationQuantity = aRespRequestItems[i].AlterationQuantity;
        oRequestItem.CancellationStatus = aRespRequestItems[i].CancellationStatus;
        // Map the Quantities to new properties to cater to Custom tailoring issue
        // Incident -  1670190179 - Change Begins
        oRequestItem.ViewPickupQuantity = aRespRequestItems[i].PickupQuantity;
        oRequestItem.ViewExchangeQuantity = aRespRequestItems[i].ExchangeQuantity;
        oRequestItem.ViewAlterationQuantity = aRespRequestItems[i].AlterationQuantity;

        // Incident - 1670190179 Ends

        oRequestItem.QuantityUnit = aRespRequestItems[i].QuantityUnit;
        oRequestItem.IsUsed = aRespRequestItems[i].IsUsed;
        oRequestItem.ConditionEnabled = aRespRequestItems[i].ConditionEnabled;
        oRequestItem.CustomTailored = aRespRequestItems[i].CustomTailored;
        oRequestItem.CustomTailoredEnabled = aRespRequestItems[i].CustomTailoredEnabled;
        oRequestItem.IsReadOnly = aRespRequestItems[i].IsReadOnly;

        oRequestItem.AlterationDate = aRespRequestItems[i].AlterationDate;
        oRequestItem.AlteredQuantity = aRespRequestItems[i].AlteredQuantity;
        oRequestItem.AlterationEnabled = aRespRequestItems[i].AlterationEnabled;
        oRequestItem.ExchangeEnabled = aRespRequestItems[i].ExchangeEnabled;

        oRequestItem.ItemText = aRespRequestItems[i].ItemText;
        oRequestItem.NewItemText = aRespRequestItems[i].NewItemText;

        // hence it should be empty for the first time
        oRequestItem.Returnable = aRespRequestItems[i].Returnable;
        oRequestItem.Price = aRespRequestItems[i].Price;
        oRequestItem.Currency = aRespRequestItems[i].Currency;

        oRequestItem.SizeRelevant = aRespRequestItems[i].SizeRelevant;
        oRequestItem.Size = aRespRequestItems[i].Size;
        oRequestItem.SizeUnit = aRespRequestItems[i].SizeUnit;

        // Map the storage location details
        oRequestItem.StorageLocationId = aRespRequestItems[i].StorageLocationId;
        oRequestItem.StorageLocationDesc = aRespRequestItems[i].StorageLocationDesc;
        oRequestItem.StorageLocationEnabled = aRespRequestItems[i].StorageLocationEnabled;
        // Create addtional fields used to fetch Instock Quantity
            oRequestItem.ValuationType = "";
            oRequestItem.ItemUsage     = "";

        // Map the Item Sizes data
        NoOfItemSizes = aRespRequestItems[i].ItemSizes.results.length;
        aRespItemSizes = aRespRequestItems[i].ItemSizes.results;
        for (var j = 0; j < NoOfItemSizes; j++) {
          // Map the Item Sizes Level Data
          oItemSize.RequestId = aRespItemSizes[j].RequestId;
          oItemSize.ItemId = aRespItemSizes[j].ItemId;
          oItemSize.ItemType = aRespItemSizes[j].ItemType;
          oItemSize.ItemPos = aRespItemSizes[j].ItemPos;
          oItemSize.Size = aRespItemSizes[j].Size;
          oItemSize.SizeUnit = aRespItemSizes[j].SizeUnit;
          oItemSize.SizeDesc = aRespItemSizes[j].SizeDesc;
          oItemSize.Item = aRespItemSizes[j].Item;
          oItemSize.InstockQuantity = aRespItemSizes[j].InstockQuantity;
          // On change of Item size - price and currency should also change
          oItemSize.Price   = aRespItemSizes[j].Price;
          oItemSize.Currency =  aRespItemSizes[j].Currency;
          aItemSizes.push(oItemSize);
          oItemSize = {};
        }

        NoOfItemSizes = 0;
        aRespItemSizes = [];
        oRequestItem.ItemSizes = aItemSizes;
        aItemSizes = [];

        // Map the Alteration Items

        NoOfAlterationItems = aRespRequestItems[i].AlterationItems.results.length;
        aRespAlterationItems = aRespRequestItems[i].AlterationItems.results;
        for (var k = 0; k < NoOfAlterationItems; k++) {
          // Map the Alteration Item level data
          oAlterationItem.RequestId = aRespAlterationItems[k].RequestId;
          oAlterationItem.ItemId = aRespAlterationItems[k].ItemId;
          oAlterationItem.ItemType = aRespAlterationItems[k].ItemType;
          oAlterationItem.ItemPos = aRespAlterationItems[k].ItemPos;
          oAlterationItem.Seqnr = aRespAlterationItems[k].Seqnr;
          oAlterationItem.AlterationDate = aRespAlterationItems[k].AlterationDate;
          oAlterationItem.DeliveryDate = aRespAlterationItems[k].DeliveryDate;
          oAlterationItem.Quantity = aRespAlterationItems[k].Quantity;
          oAlterationItem.Unit = aRespAlterationItems[k].Unit;
          oAlterationItem.Status = aRespAlterationItems[k].Status;
          oAlterationItem.StatusText = aRespAlterationItems[k].StatusText;
          oAlterationItem.CanBePicked = aRespAlterationItems[k].CanBePicked;
          oAlterationItem.AlterationItemToggle =  aRespAlterationItems[k].CanBePicked;
          aAlterationItems.push(oAlterationItem);
          oAlterationItem = {};

        }
          NoOfAlterationItems = 0;
          aRespAlterationItems = [];
          oRequestItem.AlterationItems = aAlterationItems;
          aAlterationItems = [];

        // Map the Storage Location Data
        NoOfStorageLocations = aRespRequestItems[i].StorageLocations.results.length;
        aRespStorageLocations = aRespRequestItems[i].StorageLocations.results;

        for (var l = 0; l < NoOfStorageLocations; l++) {
          // Map the Alteration Item level data
          oStorageLocation.RequestId = aRespStorageLocations[l].RequestId;
          oStorageLocation.ItemId = aRespStorageLocations[l].ItemId;
          oStorageLocation.ItemType = aRespStorageLocations[l].ItemType;
          oStorageLocation.ItemPos = aRespStorageLocations[l].ItemPos;
          oStorageLocation.ProcessType = aRespStorageLocations[l].ProcessType;
          oStorageLocation.Plant = aRespStorageLocations[l].Plant;
          oStorageLocation.ValuationType = aRespStorageLocations[l].ValuationType;
          oStorageLocation.StorLocId = aRespStorageLocations[l].StorLocId;
          oStorageLocation.StorLocDesc = aRespStorageLocations[l].StorLocDesc;
          oStorageLocation.ItemUsage = aRespStorageLocations[l].ItemUsage;
          oStorageLocation.InstockQuantity = aRespStorageLocations[l].InstockQuantity;

          aStorageLocations.push(oStorageLocation);

          //Populate the generic storage location to in both arrays
          if (oStorageLocation.StorLocId  === Config.constants.DummyStorageLocationId) {
            aUsedStorageLocations.push(oStorageLocation);
            aUnusedStorageLocations.push(oStorageLocation);
          }

          // Populate separate arrays for used and unused locations
          if (oStorageLocation.ItemUsage === Config.constants.ItemUsageUsed){
            // Append the Storage Location to list of 'Used' Storage Locations
            aUsedStorageLocations.push(oStorageLocation);
          } else if (oStorageLocation.ItemUsage === Config.constants.ItemUsageUnused){
            // Append the Storage Location to list of 'Used' Storage Locations
            aUnusedStorageLocations.push(oStorageLocation);
          }

          oStorageLocation = {};

        }

          NoOfStorageLocations = 0;
          aRespStorageLocations = [];
          oRequestItem.StorageLocations = aStorageLocations;

          // Add additional arrays with storage locations segregated based on usage.
          oRequestItem.UsedStorageLocations = aUsedStorageLocations;
          oRequestItem.UnusedStorageLocations = aUnusedStorageLocations;

          aStorageLocations = [];
          aUsedStorageLocations = [];
          aUnusedStorageLocations = [];

        aRequestItems.push(oRequestItem);

        oRequestItem = {};

        oRequest.RequestItems = aRequestItems;

      }
      return oRequest;
    }
  };
  return Mappings;
});
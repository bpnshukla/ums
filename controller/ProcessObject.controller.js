/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
/*global location*/
sap.ui.define([
	"sap/cdp/ums/managerequests/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/cdp/ums/managerequests/utils/config",
	"sap/cdp/ums/managerequests/utils/utilFunctions",
	"sap/cdp/ums/managerequests/model/formatter",
	"sap/cdp/ums/managerequests/controller/ValueHelpDialog.controller",
	"sap/ui/unified/FileUploaderParameter",
	"sap/cdp/ums/managerequests/thirdparty/epadlink",
	"sap/m/MessageToast"
], function(BaseController, MessageBox, Filter, JSONModel,
	History, Config, Utils, formatter, ValHelpDiagController, FileUploaderParameter, ePadUtils, MessageToast) {
	"use strict";
	return BaseController.extend("sap.cdp.ums.managerequests.controller.ProcessObject", {
		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					tableBusyDelay: 0,
					bUIDirty: Config.variables._IsUIDirty,
					bSubmitEnable: true,
					bCancelEnable: false,
					bOverFlowToolBarVisible: true,
					sReturnCategory: Config.constants.ReturnCategoryId,
					sCancelledStatus: Config.constants.CancelledStatusId,
					sPurchaseRequestTypeId: Config.constants.PurchaseRequestId,
					sSpecialRequestId: Config.constants.SpecialRequestId,
					sDamageByThirdPartyTypeId: Config.constants.DamageByThirdPartyTypeId,
					sLossByThirdPartyTypeId: Config.constants.LossByThirdPartyTypeId,
					sLossOnDutyTypeId: Config.constants.LossOnDutyTypeId,
					sDamageOnDutyTypeId: Config.constants.DamageOnDutyTypeId,
					sSentForApprovalStatusId: Config.constants.SentForApproval,
					sRequestCancelledStatusId: Config.constants.RequestCancelledStatusId,
					sReturnedStatusId: Config.constants.ReturnedStatusId,
					sEndOfServiceType: Config.constants.EndOfServiceType

				});
			var oTable = this.byId('idProceessRequestTable');

			//model for storing approvers for the request
			this._oApproverModel = new JSONModel({
				Approvers: []
			});
			this.getView().setModel(this._oApproverModel, "approverModel");

			//model for print options for the request
			this._oPrintModel = new JSONModel({
				PrintOptions: []
			});
			this.getView().setModel(this._oPrintModel, "printModel");

			this._oEditProcessObjectModel = new JSONModel({});
			this.getRouter().getRoute("processobject").attachPatternMatched(this._onObjectMatched, this);
			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "processObjectView");
			// Set the JSON model on the Items list
			this.setModel(this._oEditProcessObjectModel, "processObjectModel");
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(function() {
				// Restore original busy indicator delay for the Process view
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
			this._oSearchFilter = {};
			this._sSearchVal = "";
			this._bAnyItemAlteredOrPicked = false; // By Default none of the items have been Altered/Picked. Set this based on action on the Alter History Fragment
			this._sValueHelpFrag = "Receipt";
			this._inputId = this.byId("idReceiver"); // Id for the Receiver Input Control
			this._sReceiverId = ""; // Place holder for receiver id
			this._sReceiverName = ""; // Place holder for receiver name
			this._sItemTextFrag = "ItemText";
			this._sAlterHistoryFrag = "AlterHistory";
			this._sPickedReturnedColumn = this.byId("idProcessObjectPickedRequestedQtyColumnTitle");
			this._sPickupReturnQuantityColumn = this.byId("idProcessObjectPickUpQtyColumnTitle");

			this._approverListFrag = "ApproverList";
			this._sReceiverDialog = "idReceiverDialog";
			this._printListFrag = "PrintOptions";

			// Disable the checkboxes
			oTable.addDelegate({
				onAfterRendering: function() {

					this.getItems().forEach(function(oItem) {
						var oItemContext = oItem.getBindingContext("processObjectModel").getObject();

						// Locate the checkbox
						var aCheckbox = oItem.$().find('.sapMCb');
						// Find the id of the checkbox
						var oCheckbox = sap.ui.getCore().byId(aCheckbox.attr('id'));

						// Control the editability of the check box
						// Checkbox will not be shown always - In case of 'Cancelled' /'Sent For Alteration' Status
						// Cancel checkbox will not be visible
						if (oCheckbox !== undefined) {
							oCheckbox.setEnabled(!oItemContext.IsReadOnly);
						}
					});
				}
			}, oTable);
		},

		/**
		 * Handler for custom tailoring button
		 * @param {sap.ui.base.Event} oEvent The source of the Event
		 * @public
		 */
		onCustTailor: function(oControlEvent) {
			var sPathViewPickUpQty = "",
				sPathViewExchangeQty = "",
				sPathViewAlterationQty = "";
			sPathViewPickUpQty = oControlEvent.getSource().getBindingContext("processObjectModel").getPath() + "/ViewPickupQuantity";
			sPathViewExchangeQty = oControlEvent.getSource().getBindingContext("processObjectModel").getPath() + "/ViewExchangeQuantity";
			sPathViewAlterationQty = oControlEvent.getSource().getBindingContext("processObjectModel").getPath() + "/ViewAlterationQuantity";
			// Set the 'Enabled' property for the PickUp, Exchange & Alteration Quantity column based on tailoring type(Standard/Custom)
			if (oControlEvent.getSource().getBindingContext("processObjectModel").getProperty("CustomTailored")) {
				// In case of Custom Tailoring set all the quantities to 0 - 0 is also a valid value so reset the ValueState
				// and ValueState text of all the below quantity fields

				this._resetValueStateOnCustomTailoring(oControlEvent);

				this.getView().getModel("processObjectModel").setProperty(sPathViewPickUpQty, 0);
				this.getView().getModel("processObjectModel").setProperty(sPathViewExchangeQty, 0);
				this.getView().getModel("processObjectModel").setProperty(sPathViewAlterationQty, 0);

			} else {
				// Retain the old state of quantities and show
				this.getView().getModel("processObjectModel").setProperty(sPathViewPickUpQty,
					oControlEvent.getSource().getBindingContext("processObjectModel").getProperty("PickupQuantity"));
				this.getView().getModel("processObjectModel").setProperty(sPathViewExchangeQty,
					oControlEvent.getSource().getBindingContext("processObjectModel").getProperty("ExchangeQuantity"));
				this.getView().getModel("processObjectModel").setProperty(sPathViewAlterationQty,
					oControlEvent.getSource().getBindingContext("processObjectModel").getProperty("AlterationQuantity"));
			}

			Utils.onToggleButton(oControlEvent.getSource(),
				this.getResourceBundle().getText("processButCustomTailoring"),
				this.getResourceBundle().getText("processButStandardTailoring"));
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());
		},

		/**
		 * Handler for Used/Unused button
		 * @param {sap.ui.base.Event} oEvent The source of the Event
		 * @public
		 */
		onUsed: function(oControlEvent) {
			var sRequestItemPath = "",
				sRequestItemStorageLocationIdPath = "",
				sRequestItemIsUsedPath = "",
				sRequestItemFirstUsedStorageLocationIdPath = "",
				sRequestItemFirstUnusedStorageLocationIdPath = "",
				sRequestItemFirstUsedStorageLocationIdValue = "",
				sRequestItemFirstUnusedStorageLocationIdValue = "";

			Utils.onToggleButton(oControlEvent.getSource(),
				this.getResourceBundle().getText("processButUsed"),
				this.getResourceBundle().getText("processButUnUsed"));
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			// Also update the StorageLocationId at Request Item based on 'Used'/ ' Unused' State
			// Always the first value of storage location (either used or unused) will  be passed.

			sRequestItemPath = oControlEvent.getSource().getBindingContext('processObjectModel').getPath();
			sRequestItemIsUsedPath = sRequestItemPath + '/IsUsed';
			sRequestItemStorageLocationIdPath = sRequestItemPath + '/StorageLocationId';

			// Check Used status of item
			if (this._oEditProcessObjectModel.getProperty(sRequestItemIsUsedPath)) {
				// Item is Used
				// Pick first value from the Used Storage Locations

				sRequestItemFirstUsedStorageLocationIdPath = sRequestItemPath + '/UsedStorageLocations/0/StorLocId';
				sRequestItemFirstUsedStorageLocationIdValue = this._oEditProcessObjectModel.getProperty(sRequestItemFirstUsedStorageLocationIdPath);

				// Over write the Storage Location value at request item level
				this._oEditProcessObjectModel.setProperty(sRequestItemStorageLocationIdPath, sRequestItemFirstUsedStorageLocationIdValue);

			} else {
				// Item is Unused
				// Pick first value from the Unused Storage Locations

				sRequestItemFirstUnusedStorageLocationIdPath = sRequestItemPath + '/UnusedStorageLocations/0/StorLocId';
				sRequestItemFirstUnusedStorageLocationIdValue = this._oEditProcessObjectModel.getProperty(
					sRequestItemFirstUnusedStorageLocationIdPath);

				// Over write the Storage Location value at request item level
				this._oEditProcessObjectModel.setProperty(sRequestItemStorageLocationIdPath, sRequestItemFirstUnusedStorageLocationIdValue);
			}
		},

		/**
		 * Event handler  for navigating back.
		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack: function() {
			// Show Information Loss popover only when the data has been modified on the UI
			if (Utils.isUIDirty()) {
				Utils.showConfirmationDialog.call(this, this.getResourceBundle()
					.getText("confirmBack"), this.getResourceBundle()
					.getText("dlgConfirm"), this._navigateBack);
			} else {
				// Simply go back
				this._navigateBack();
			}
		},

		/**
		 * On Press of Item Comments Button
		 * @param {sap.ui.base.Event} oEvent The source of the Event
		 * @public
		 */
		onItemCommentPress: function(oEvent) {
			var oItemTextPopOver = {};
			var sPath = oEvent.getSource().getBindingContext('processObjectModel').getPath();
			var sNewText = sPath + "/NewItemText";
			var sText = sPath + "/ItemText";

			var newItemText = this.getModel('processObjectModel').getProperty(sNewText);
			var itemText = this.getModel('processObjectModel').getProperty(sText);

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			oItemTextPopOver = Utils.getFragment.call(this, this._sItemTextFrag);
			this.getView().addDependent(oItemTextPopOver);
			oItemTextPopOver.setBindingContext(sPath, 'processObjectModel');

			oItemTextPopOver.getContent()[0].setValue(itemText);
			oItemTextPopOver.getContent()[1].setValue(newItemText);

			// Control the input/visibility of 'New Item Text' based on 'Read Only' Flag
			oItemTextPopOver.getContent()[1].setVisible(!this.getModel('processObjectModel').getProperty(sPath + '/IsReadOnly'));
			oItemTextPopOver.openBy(oEvent.getSource());
		},

		/**
		 * Handles the Items comment changes
		 * @param {sap.ui.base.Event} oEvent The source of the Event		 
		 * @public
		 */
		onItemCommentChange: function(oEvent) {

			var oControl = oEvent.getSource();
			var sPath = oControl.getBindingContext("processObjectModel");
			var sProperty = sPath + "/NewItemText";

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			this._oEditProcessObjectModel.setProperty(sProperty, oControl.getValue());
		},

		/**
		 * Event handler for print button
		 * @param {sap.ui.base.Event} oEvent The source of the Event		 
		 * @public
		 */
		onPressPrint: function(oEvent) {
			//show list to choose timestamp
			var mParams = {};
			var oView = this.getView();
			var sPath = oView.getBindingContext().getPath();
			var oModel = oView.getModel();
			mParams = {
				urlParameters: {
					"$expand": ["RequestPrintListSet"]
				},
				success: function(oData) {
					this.getModel("printModel").setProperty('/PrintOptions', oData.RequestPrintListSet.results);
					this._showPrintOptions();
				}.bind(this),
				error: function(oError) {}.bind(this)
			};
			// Call the Print method
			oModel.read(sPath, mParams);
		},
		/**
		 * Backend call to fetch print data
		 * @param {sap.ui.base.Event} oEvent The source of the Event	
		 * @public
		 */
		onPrintRequest: function(oEvent) {
			var oContext = oEvent.getSource().getBindingContext().getObject();
			//var timestamp = new Date(oEvent.getSource().getSelectedItem().getKey());
			var timestamp = new Date(oEvent.getParameters().item.getKey());

			var sPath = "",
				location = "",
				pdfURL = "";
			// Prepare the timestamp which is used in file name
			timestamp = timestamp.toISOString();
			timestamp = timestamp.substr(0, 23);

			sPath = "/RequestPrintSet(RequestId='" + oContext.RequestId + "',CreatedOn=datetime'" + timestamp + "')/$value";
			location = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
			// PDF Url for the download
			pdfURL = location + "/sap/opu/odata/sap/ZUMS_MANAGE_REQUESTS" + sPath;
			window.location.href = pdfURL;
		},

		/**
		 * Event handler to show list of messages
		 * @param {sap.ui.base.Event} oEvent The source of the Event	
		 * @public
		 */
		onMessagePopPress: function(oControlEvent) {
			Utils.showMessgePopover(oControlEvent.getSource());
		},

		/**
		 * Event handler for change of Final Settlement checkbox
		 * This updates the return quantity as zero in case the final settlement is chosen.
		 * @param {sap.ui.base.Event} oEvent containing source of event
		 * @public
		 */
		onFinalSettlementSelect: function(oEvent) {
			var oCheckbox = oEvent.getSource();
			var bCheckboxState = oCheckbox.getSelected();

			// Make the return quantity as '0' in case Final Settlement is selected else restore the old value
			for (var i = 0; i < this.getModel('processObjectModel').getData().Request.RequestItems.length; i++) {
				if (bCheckboxState) {
					this.getModel('processObjectModel').getData().Request.RequestItems[i].ViewPickupQuantity = 0;
				} else {
					this.getModel('processObjectModel').getData().Request.RequestItems[i].ViewPickupQuantity = this.getModel('processObjectModel').getData()
						.Request.RequestItems[i].PickupQuantity;
				}
			}
		},

		/**
		 * Event handler for change of Item Size
		 * This updates the Item Price with currency, Item Id and Size
		 * @param {sap.ui.base.Event} oEvent containing source of event
		 * @public
		 */
		onItemSizeChange: function(oEvent) {

			// Get the New Item id based on size chosen and populate in the Model
			var oControl = oEvent.getSource();
			var sPath = oControl.getBindingContext('processObjectModel').getPath();

			// Update the Item Desription and In Stock Quantity            
			var sNewItemId = sPath + "/NewItemId";
			var sPrice = sPath + "/Price";
			var sCurrency = sPath + "/Currency";
			// Below property(ies) need to be updated so that the Text control has correct values shown      
			var sSize = sPath + "/Size";

			// Update the Item Desription and In Stock Quantity
			var sItemInstockQuantity = sPath + "/InstockQuantity";

			var sNewItemIdValue = oControl.getSelectedKey();
			var sItemPriceValue = oControl.getSelectedItem().getBindingContext('processObjectModel').getProperty("Price");
			var sItemCurrencyValue = oControl.getSelectedItem().getBindingContext('processObjectModel').getProperty("Currency");

			var sItemSizeValue = oControl.getSelectedItem().getBindingContext('processObjectModel').getProperty("SizeDesc");

			var sRequestId = this._oEditProcessObjectModel.getData().Request.RequestId;

			// Setting the view as dirty been moved here and if behavior is not adequate then it will be moved on top of this function
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			this._oEditProcessObjectModel.setProperty(sNewItemId, sNewItemIdValue);
			this._oEditProcessObjectModel.setProperty(sPrice, sItemPriceValue);
			this._oEditProcessObjectModel.setProperty(sCurrency, sItemCurrencyValue);

			this._oEditProcessObjectModel.setProperty(sSize, sItemSizeValue);
			// Get the latest InStock Quantity 
			this._getInstockQuantity(oControl, sRequestId, sItemInstockQuantity);

		},

		/**
		 * Event handler for change of Storage Location
		 * This updates the Item In Stock Qty
		 * @param {sap.ui.base.Event} oEvent containing source of event
		 * @public
		 */
		onStorageLocationChange: function(oEvent) {

			// Get the New Item id based on size chosen and populate in the Model
			var oControl = oEvent.getSource();
			var sPath = oControl.getBindingContext('processObjectModel').getPath();
			// Update the Item Desription and In Stock Quantity ; ; ; ; ; ;
			var sItemInstockQuantity = sPath + "/InstockQuantity";
			// Below property(ies) need to be updated so that the Text control has correct values shown ; ; ; ; ; ;
			var sStorageLocationDesc = sPath + "/StorageLocationDesc";
			var sStorageLocationId = sPath + "/StorageLocationId";

			///Update the value of 'ItemUsage' and 'ValuationType' from Storage Location to
			// properties at request item level
			var sItemUsage = sPath + "/ItemUsage";
			var sValuationType = sPath + "/ValuationType";
			var sStorageLocationDescValue = oControl.getSelectedItem().getBindingContext('processObjectModel').getProperty("StorLocDesc");
			var sStorageLocationIdValue = oControl.getSelectedItem().getBindingContext('processObjectModel').getProperty("StorLocId");

			var sItemUsageValue = oControl.getSelectedItem().getBindingContext('processObjectModel').getProperty("ItemUsage");
			var sValuationTypeValue = oControl.getSelectedItem().getBindingContext('processObjectModel').getProperty("ValuationType");

			var sRequestId = this._oEditProcessObjectModel.getData().Request.RequestId;

			// Setting the view as dirty been moved here and if behavior is not adequate then it will be moved on top of this function
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			this._oEditProcessObjectModel.setProperty(sStorageLocationDesc, sStorageLocationDescValue);
			this._oEditProcessObjectModel.setProperty(sStorageLocationId, sStorageLocationIdValue);
			this._oEditProcessObjectModel.setProperty(sItemUsage, sItemUsageValue);
			this._oEditProcessObjectModel.setProperty(sValuationType, sValuationTypeValue);

			// Get the latest InStock Quantity 
			this._getInstockQuantity(oControl, sRequestId, sItemInstockQuantity);

			// Set the selected key explicity
			oControl.setSelectedKey(oControl.getSelectedKey());
		},

		/**
		 * Read approvers for the request
		 * @param {sap.ui.base.Event} oEvent containing source of event
		 * @public
		 */
		onShowApprovers: function(oEvent) {
			var mParams = {};
			var oView = this.getView();
			var sPath = oView.getBindingContext().getPath();
			var oModel = oView.getModel();

			mParams = {
				urlParameters: {
					"$expand": ["RequestApprovers"]
				},
				success: function(oData) {
					this.getModel("approverModel").setProperty('/Approvers', oData.RequestApprovers.results);
					// Call the function to display the approver fragment
					this._showApproverList();
				}.bind(this),
				error: function(oError) {}.bind(this)
			};
			oModel.read(sPath, mParams);
		},
		/**
		 * Event handler for Refresh Button
		 * @public
		 */
		onRefresh: function() {
			var sObjectPath = "";
			// Unset the dirty flag on UI
			Utils.setUIDirty(false);
			// Reset the Invalid UI Map to reflect the original UI State.
			Config.InvalidUIMap = {};
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			// Below is part of Cancel Checkbox design
			this.byId("idProceessRequestTable").removeSelections();

			sObjectPath = "/Requests(RequestId='" + this._oEditProcessObjectModel.getData().Request.RequestId + "')";
			this._bindView(sObjectPath);
		},

		/**
		 * Event handler for Issue or Return Request
		 * @param {sap.ui.base.Event} oEvent containing source of event
		 * @public
		 */
		onSubmit: function(oEvent) {
			var bValid = true;
			// Check the state of UI - In case of Invalid UI don't show Receipt Popover
			if (Object.keys(Config.InvalidUIMap).length) {
				MessageBox.show(this.getResourceBundle().getText("invalidUIError"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			} else {
				//Validate whether alteration quantity and date both should be entered or none for all the records
				// Further validate whete
				bValid = this._validateChanges(Config.constants.UpdateAction);
				if (bValid) {
					Utils.showConfirmationDialog.call(this, this.getResourceBundle().getText("confirmSubmit"),
						this.getResourceBundle().getText("dlgConfirm"), this._submitChanges);
				}
			}
		},

		/**
		 * Event handler for Cancel Request
		 * @param {sap.ui.base.Event} oEvent containing source of event
		 * @public
		 */
		onCancelRequest: function(oEvent) {
			var oViewModel = this.getModel("processObjectView");
			// Display cancel confirmation dialog
			Utils.showConfirmationDialog.call(this, this.getResourceBundle().getText("confirmCancelRequest"),
				this.getResourceBundle().getText("dlgConfirm"), this._cancelChanges);
		},

		/**
		 * Handler for Showing the history of the Alterations
		 * @param  {sap.ui.base.Event} oEvent containing source of event
		 * @public
		 */
		onAlterItems: function(oEvent) {
			var oHistPopover = Utils.getFragment.call(this, this._sAlterHistoryFrag);
			this.getView().addDependent(oHistPopover);
			oHistPopover.setModel(this._oEditProcessObjectModel, "processObjectModel");
			oHistPopover.setBindingContext(oEvent.getSource()
				.getBindingContext('processObjectModel'), "processObjectModel");
			oHistPopover.openBy(oEvent.getSource());
		},

		/*
		 * Handler for toggling the status of the alteration items
		 * @param  {sap.ui.base.Event} oEvent containing source of event
		 * @public
		 */
		onAlterItemStatus: function(oControlEvent) {

			var oModel = this.getModel("processObjectModel");

			var sPathStatusText = oControlEvent.getSource().getBindingContext("processObjectModel").getPath("StatusText");
			var sPathStatus = oControlEvent.getSource().getBindingContext("processObjectModel").getPath("Status");

			var sAlterationToggle = oControlEvent.getSource().getBindingContext("processObjectModel").getPath("AlterationItemToggle");
			var bAlterationToggle = oModel.getProperty(sAlterationToggle);

			// Setting the view as dirty been moved here and if behavior is not adequate then it will be moved on top of this function
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			// Update the Status text based on state of this toggle
			if (bAlterationToggle) {
				// Here the status shoule be - Altered
				oModel.setProperty(sPathStatusText, this.getResourceBundle().getText("processAltered"));
				oModel.setProperty(sPathStatus, Config.constants.AlteredStatusId);
			} else {
				// Here the status should be -Picked Up
				oModel.setProperty(sPathStatusText, this.getResourceBundle().getText("processPickedUp"));
				oModel.setProperty(sPathStatus, Config.constants.PickedUpStatusId);
			}

			// Set the flag in case any item has been 'Picked Up' or 'Altered'
			// This denotes that user has taken action on this fragment
			this._bAnyItemAlteredOrPicked = true;

		},

		/**
		 * Event handler for validating the PickUp Quantity Change
		 * @param  {sap.ui.base.Event} oControlEvent containing source of event
		 * @public
		 */
		onPickUpQuantityChange: function(oControlEvent) {
			var oContext = oControlEvent.getSource().getBindingContext("processObjectModel");
			var sPath = oContext.getPath("ViewPickupQuantity");
			var sPickupQty = oContext.getProperty("ViewPickupQuantity");
			var sRemainingQty = oContext.getProperty("RemainingQuantity");

			// Check the number validity and set value state text
			// If wrong parameters are passed then the input control will not have any Value State information
			// and the program will dump with an error logged in console
			var oStateInformation = Utils.validateQuantity(oControlEvent.getSource().getValue(), sPickupQty, sRemainingQty);

			var sProperty = oContext.getPath() + "/PickUpValueState";
			var sPropertyText = oContext.getPath() + "/PickUpValueStateText";
			var sValueState = sap.ui.core.ValueState.None;

			// Determine Request Category  - Issue / Return only if its a postive number
			if (oStateInformation.sValueStateText === "") {
				oStateInformation.sValueStateText = (this._oEditProcessObjectModel.getData().Request.CategoryId === Config.constants.IssueCategoryId) ?
					"pickUpQuantityErrorText" : "returnQuantityErrorText";
			}

			if (!oStateInformation.bValid) {
				sValueState = sap.ui.core.ValueState.Error;
				// clear the value in control
				oControlEvent.getSource().setValue("");
			}
			// Call function to set Value State
			Utils.setValueState(this, sProperty, sValueState);
			// Call function to set Value State Text
			Utils.setValueStateText(this, sPropertyText, oStateInformation.sValueStateText);
			// Call function to set validation state
			Utils.setUIValidationState(sPath, sProperty, oStateInformation.bValid);

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());
		},

		/**
		 * Event handler for validating the Excahneg Quantity Change
		 * @param  {sap.ui.base.Event} oControlEvent containing source of event
		 * @public
		 */
		onExchangeQuantityChange: function(oControlEvent) {
			var oContext = oControlEvent.getSource().getBindingContext("processObjectModel");
			var sPath = oContext.getPath("ViewExchangeQuantity");
			var sExchangeQuantity = oContext.getProperty("ViewExchangeQuantity");
			var sPickedQuantity = oContext.getProperty("PickedQuantity");
			// Check the number validity and set value state text
			// If wrong parameters are passed then the input control will not have any Value State information
			// and the program will dump with an error logged in console
			var oStateInformation = Utils.validateQuantity(oControlEvent.getSource().getValue(), sExchangeQuantity, sPickedQuantity);

			var sProperty = oContext.getPath() + "/ExchangeValueState";
			var sPropertyText = oContext.getPath() + "/ExchangeValueStateText";
			var sValueState = sap.ui.core.ValueState.None;

			// Set the error text id
			if (oStateInformation.sValueStateText === "") {
				oStateInformation.sValueStateText = "exchangeQuantityErrorText";
			}

			if (!oStateInformation.bValid) {
				sValueState = sap.ui.core.ValueState.Error;
				// clear the value in control
				oControlEvent.getSource().setValue("");
			}
			// Call function to set Value State
			Utils.setValueState(this, sProperty, sValueState);
			// Call function to set Value State Text
			Utils.setValueStateText(this, sPropertyText, oStateInformation.sValueStateText);
			// Call function to set validation state
			Utils.setUIValidationState(sPath, sProperty, oStateInformation.bValid);

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());
		},

		/**
		 * Event handler for validating the Alteration Quantity Change
		 * @param  {sap.ui.base.Event} oControlEvent containing source of event
		 * @public
		 */
		onAlterationQuantityChange: function(oControlEvent) {
			var oContext = oControlEvent.getSource().getBindingContext("processObjectModel");
			var sPath = oContext.getPath("ViewAlterationQuantity");
			var sAlterationQuantity = oContext.getProperty("ViewAlterationQuantity");
			var sPickedQuantity = oContext.getProperty("PickedQuantity");
			var sAlteredQuantity = oContext.getProperty("AlteredQuantity");
			var sMaximumAlterationAllowedQuan = parseInt(sPickedQuantity, 10) - parseInt(sAlteredQuantity, 10);
			// Check the number validity and set value state text
			// If wrong parameters are passed then the input control will not have any Value State information
			// and the program will dump with an error logged in console

			var oStateInformation = Utils.validateQuantity(oControlEvent.getSource().getValue(), sAlterationQuantity,
				sMaximumAlterationAllowedQuan);

			var sProperty = oContext.getPath() + "/AlterationValueState";
			var sPropertyText = oContext.getPath() + "/AlterationValueStateText";
			var sValueState = sap.ui.core.ValueState.None;

			// Set the error text id
			if (oStateInformation.sValueStateText === "") {
				oStateInformation.sValueStateText = "alterationQuantityErrorText";
			}

			if (!oStateInformation.bValid) {
				sValueState = sap.ui.core.ValueState.Error;
				// clear the value in control
				oControlEvent.getSource().setValue("");
			}

			// Call function to set Value State
			Utils.setValueState(this, sProperty, sValueState);
			// Call function to set Value State Text
			Utils.setValueStateText(this, sPropertyText, oStateInformation.sValueStateText);
			// Call function to set validation state
			Utils.setUIValidationState(sPath, sProperty, oStateInformation.bValid);

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());
		},

		/**
		 * Event handler for Receiver Value Help 
		 * @param  {sap.ui.base.Event} oControlEvent containing source of event
		 * @public
		 */
		handleValueHelp: function(oControlEvent) {
			var sInputValue = oControlEvent.getSource().getValue();
			var oValueHelpDialog = Utils.getFragment.call(this, this._sValueHelpFrag);
			this.getView().addDependent(oValueHelpDialog);
			oValueHelpDialog.setModel(this.getView().getModel());

			// create a filter for the binding
			oValueHelpDialog.getBinding("items").filter([new Filter("Name", sap.ui.model.FilterOperator.Contains, sInputValue)]);
			// open value help dialog filtered by the input value
			oValueHelpDialog.open(sInputValue);

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());
		},

		/**
		 * Event handler for Serach Action Receiver Value Help 
		 * @param  {sap.ui.base.Event} oControlEvent containing source of event
		 * @public
		 */
		handleValueHelpSearch: function(oControlEvent) {
			var sValue = oControlEvent.getParameter("value");
			var oFilter = new Filter("Name", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oControlEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},

		/**
		 * Event handler for Close/Cancel Action Receiver Value Help 
		 * @param  {sap.ui.base.Event} oControlEvent containing source of event
		 * @public
		 */
		handleValueHelpClose: function(oControlEvent) {
			var oSelectedItem = oControlEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				this._inputId.setValue(oSelectedItem.getTitle());
				// Set the receiver details 
				this._sReceiverId = oSelectedItem.getDescription();
				this._sReceiverName = oSelectedItem.getTitle();
			}

			oControlEvent.getSource().getBinding("items").filter([]);
		},

		/**
		 * Handle the item selection for cancellation. Also control the state of 'Submit' & 'Cancel' Buttons
		 * @param  {sap.ui.base.Event} oControlEvent containing source of event
		 * @public		 
		 */
		onItemSelected: function(oControlEvent) {

			var sPathViewPickUpQty = "",
				sPathViewExchangeQty = "",
				sPathViewAlterationQty = "";

			// Get all the selected items - ones marked for cancellation
			for (var i = 0; i < oControlEvent.getSource().getItems().length; i++) {
				if (oControlEvent.getSource().getItems()[i].getSelected()) {
					this.getModel("processObjectModel").setProperty(oControlEvent.getSource().getItems()[i].getBindingContext('processObjectModel').getPath() +
						'/CancellationStatus', true);
					sPathViewPickUpQty = oControlEvent.getSource().getItems()[i].getBindingContext('processObjectModel').getPath() +
						"/ViewPickupQuantity";
					sPathViewExchangeQty = oControlEvent.getSource().getItems()[i].getBindingContext('processObjectModel').getPath() +
						"/ViewExchangeQuantity";
					sPathViewAlterationQty = oControlEvent.getSource().getItems()[i].getBindingContext('processObjectModel').getPath() +
						"/ViewAlterationQuantity";

					// In case of Items marked for cancellation set all the quantities to 0 - 0 is also a valid value so reset the ValueState
					// and ValueState text of all the below quantity fields
					this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getItems()[i].getBindingContext(
							'processObjectModel').getPath() +
						"/PickUpValueState", sap.ui.core.ValueState.None);
					this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getItems()[i].getBindingContext(
							'processObjectModel').getPath() +
						"/ExchangeValueState", sap.ui.core.ValueState.None);
					this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getItems()[i].getBindingContext(
							'processObjectModel').getPath() +
						"/AlterationValueState", sap.ui.core.ValueState.None);
					this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getItems()[i].getBindingContext(
							'processObjectModel').getPath() +
						"/ExchangeValueStateText", "");
					this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getItems()[i].getBindingContext(
							'processObjectModel').getPath() +
						"/PickUpValueStateText", "");
					this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getItems()[i].getBindingContext(
							'processObjectModel').getPath() +
						"/AlterationValueStateText", "");

					this.getView().getModel("processObjectModel").setProperty(sPathViewPickUpQty, 0);
					this.getView().getModel("processObjectModel").setProperty(sPathViewExchangeQty, 0);
					this.getView().getModel("processObjectModel").setProperty(sPathViewAlterationQty, 0);

				} else {
					this.getModel("processObjectModel").setProperty(oControlEvent.getSource().getItems()[i].getBindingContext('processObjectModel').getPath() +
						'/CancellationStatus', false);

					sPathViewPickUpQty = oControlEvent.getSource().getItems()[i].getBindingContext('processObjectModel').getPath() +
						"/ViewPickupQuantity";
					sPathViewExchangeQty = oControlEvent.getSource().getItems()[i].getBindingContext('processObjectModel').getPath() +
						"/ViewExchangeQuantity";
					sPathViewAlterationQty = oControlEvent.getSource().getItems()[i].getBindingContext('processObjectModel').getPath() +
						"/ViewAlterationQuantity";

					// Retain the old state of quantities and show
					this.getView().getModel("processObjectModel").setProperty(sPathViewPickUpQty,
						oControlEvent.getSource().getItems()[i].getBindingContext("processObjectModel").getProperty("PickupQuantity"));
					this.getView().getModel("processObjectModel").setProperty(sPathViewExchangeQty,
						oControlEvent.getSource().getItems()[i].getBindingContext("processObjectModel").getProperty("ExchangeQuantity"));
					this.getView().getModel("processObjectModel").setProperty(sPathViewAlterationQty,
						oControlEvent.getSource().getItems()[i].getBindingContext("processObjectModel").getProperty("AlterationQuantity"));
				}
			}

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			// If request is in 'Sent for Approval' / 'Cancelled' State - It is frozen for editing and
			// no 'Submit' or 'cancel' be allowed

			if (!oControlEvent.getSource().getBindingContext().getProperty('Editable')) {
				this._updateViewModelProperty("/bSubmitEnable", false);
				this._updateViewModelProperty("/bCancelEnable", false);
			} else {
				// Control the editability of 'Cancel' and 'Submit' Buttons
				if (oControlEvent.getSource().getSelectedContexts().length > 0) {
					// At least one item has been marked for cancellation and hence 'Submit' should be disabled
					// and 'Cancel' be enabled
					this._updateViewModelProperty("/bSubmitEnable", false);
					this._updateViewModelProperty("/bCancelEnable", true);

				} else {
					// No items have been marked for cancellation and hence 'Cancel' should be disabled
					// and 'Submit' be enabled
					this._updateViewModelProperty("/bCancelEnable", false);
					this._updateViewModelProperty("/bSubmitEnable", true);

				}
			}
		},

		/**
		 * Fetch the attachments
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @public
		 */
		onAttachmentPress: function(oEvent) {
			var oContext = oEvent.oSource.getBindingContext();
			var oItem = oContext.getObject();
			var sServiceUrl = oContext.oModel.sServiceUrl;
			// fetch the attachment path
			var sPath = "/AttachmentDataSet(RequestId='" + oItem.RequestId + "',DocumentId='" +
				oItem.DocumentId + "')/$value";

			var location = window.location.protocol + "//" + window.location.hostname +
				(window.location.port ? ':' + window.location.port : '');
			// formulate the complete Attachment URL
			var pdfURL = location + sServiceUrl + sPath;
			window.location.href = pdfURL;
		},
		/**
		 * Handler for Sign and Submit Button		 
		 * @public
		 */
		onSignAndSubmit: function() {
			var bValid = true;
			// Check the state of UI - In case of Invalid UI don't show Receipt Popover
			if (Object.keys(Config.InvalidUIMap).length) {
				MessageBox.show(this.getResourceBundle().getText("invalidUIError"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			} else {
				//Validate whether alteration quantity and date both should be entered or none for all the records
				// Further validate whete
				bValid = this._validateChanges(Config.constants.UpdateAction);
				if (bValid) {
					Utils.showConfirmationDialog.call(this, this.getResourceBundle().getText("confirmSubmit"),
						this.getResourceBundle().getText("dlgConfirm"), this._captureSign);
				}
			}
		},

		/**
		 * Navigates to worklist screen		 
		 * @private
		 */
		_navigateBack: function() {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			var bReplace = true;

			// Below is part of Cancel Checkbox design
			// Remove the selected checkboxes
			this.byId("idProceessRequestTable").removeSelections();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history				
				this.getRouter().navTo("worklist", {}, bReplace);
			}
		},

		/**
		 * Resets the value state and value state text of all input controls once the item is
		 * is marked for Custom Tailoring
		 * @param {Object}    Object having the Source of the event
		 * @private
		 */
		_resetValueStateOnCustomTailoring: function(oControlEvent) {
			// In case of Custom Tailoring set all the quantities to 0 - 0 is also a valid value so reset the ValueState
			// and ValueState text of all the below quantity fields
			this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getBindingContext("processObjectModel").getPath() +
				"/PickUpValueState", sap.ui.core.ValueState.None);
			this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getBindingContext("processObjectModel").getPath() +
				"/ExchangeValueState", sap.ui.core.ValueState.None);
			this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getBindingContext("processObjectModel").getPath() +
				"/AlterationValueState", sap.ui.core.ValueState.None);
			this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getBindingContext("processObjectModel").getPath() +
				"/ExchangeValueStateText", "");
			this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getBindingContext("processObjectModel").getPath() +
				"/PickUpValueStateText", "");
			this.getView().getModel("processObjectModel").setProperty(oControlEvent.getSource().getBindingContext("processObjectModel").getPath() +
				"/AlterationValueStateText", "");
		},
		/**
		 * Show approvers for the request
		 * @private
		 */
		_showApproverList: function() {
			var sPath = this.getView().getBindingContext().getPath();
			var oApproverPopOver = Utils.getFragment.call(this, this._approverListFrag);
			this.getView().addDependent(oApproverPopOver);
			oApproverPopOver.bindElement(sPath, 'approverModel');
			oApproverPopOver.openBy(this.byId('idApprover'));
		},
		/**
		 * Get the data for print options
		 * @private
		 */
		_showPrintOptions: function() {
			var sPath = this.getView().getBindingContext().getPath();
			var oPrintList = Utils.getFragment.call(this, this._printListFrag);
			this.getView().addDependent(oPrintList);
			oPrintList.bindElement(sPath, 'printModel');
			oPrintList.openBy(this.byId('idPrintButton'));
		},
		/**
		 * Do below Validations -     
		 * 1. Validate whether Exchange/Alteration/Status Change of at least one alteration item has occured or not  
		 * 2. Validate whehether Storage Location is present for Issue/Return   
		 * @param {string}    Action - Issue /Return
		 * @return {Boolean}  Validate the submit process
		 * @private
		 */
		_validateChanges: function(sAction) {

			var oRequest = this._oEditProcessObjectModel.getData().Request;
			var i = 0,
				iAlterationQuantity = 0,
				iRequestAlterationQuantity = 0,
				iRequestExchangeQuantity = 0;

			//  If the the action is issue or return, then we need to put the receiver also
			if (sAction !== Config.constants.UpdateAction) {
				return null;
			}

			// Loop and check whether the both alteration fields are filled or not
			for (i = 0; i < oRequest.RequestItems.length; i++) {
				iAlterationQuantity = parseInt(oRequest.RequestItems[i].ViewAlterationQuantity, 10);

				// Add up the alteration quantity at the Request Level
				iRequestAlterationQuantity = iRequestAlterationQuantity + iAlterationQuantity;
				// Add up the exchange quantity at the Request Level
				iRequestExchangeQuantity = iRequestExchangeQuantity + parseInt(oRequest.RequestItems[i].ViewExchangeQuantity, 10);
				iAlterationQuantity = 0;

				// Below has to be checked only if 'Remaining Quantity' is more than 0 i.e. some stock is yet to be issued
				// Do the validation that Storage Location needs to be populated in case the 'Pick Up Quantity'
				// is filled in case of 'Issue/Return' request     
				// Additional 'OR' condition for blank check was needed because we are not explicitly setting
				// Selected Key in View and on Initial Load of App the value will not be set  if the item has
				// not been Issued or returned at least once   
				if (oRequest.RequestItems[i].StorageLocationEnabled) {
					if (parseInt(oRequest.RequestItems[i].RemainingQuantity, 10)) {
						if (parseInt(oRequest.RequestItems[i].ViewPickupQuantity, 10) > 0 &&
							oRequest.RequestItems[i].StorageLocationId === Config.constants.DummyStorageLocationId ||
							parseInt(oRequest.RequestItems[i].ViewPickupQuantity, 10) > 0 &&
							oRequest.RequestItems[i].StorageLocationId === ""
						) {
							// Raise error in case the Dummy Storage Location Id is selected.
							MessageBox.show(this.getResourceBundle().getText("missingStorageLoc"), {
								icon: sap.m.MessageBox.Icon.ERROR
							});
							return false;
						}
					}
				}
			}

			// If No quantity is to be picked up / to be returned then 
			// validate further for subsequent processes
			if (parseInt(oRequest.TotalIssueReturn, 10) <= 0) {
				// At least one amongst alteration / exchange  / status change of alteration items has to be present else throw error and
				// do not call the backend
				if (iRequestAlterationQuantity === 0 && iRequestExchangeQuantity === 0 && this._bAnyItemAlteredOrPicked === false) {
					// Raise error for Issue Process
					if (oRequest.CategoryId === Config.constants.IssueCategoryId) {
						MessageBox.show(this.getResourceBundle().getText("missingAltExchProcess"), {
							icon: sap.m.MessageBox.Icon.ERROR
						});
					} else {
						// Raise error for Return Process
						MessageBox.show(this.getResourceBundle().getText("returnProcessError"), {
							icon: sap.m.MessageBox.Icon.ERROR
						});
					}
					return false;
				}
			}
			return true;
		},

		/**
		 * Gathers the screen data and initates the 'Issue/Return'call
		 * @private
		 */
		_submitChanges: function() {
			var postData = this._createPostData(Config.constants.UpdateAction);
			// open up receipts view for further processing
			//send backend request
			this._sendPostRequest(postData);
		},

		/**
		 * Handler for cancel changes		 
		 * @private
		 */
		_cancelChanges: function() {
			//set data to be sent to backend
			var postData = this._createPostData(Config.constants.CancelAction);
			//send backend request
			this._sendPostRequest(postData);
		},

		/**
		 * Gets all the data to be sent in the Issue or Return/Cancel Request
		 * @param {String} sAction Action
		 * @return {JSON} [aRequest] Post Data
		 * @private
		 */
		_createPostData: function(sAction) {
			// Retrieving the header notes as they are not bound by any field
			var headerText = this.byId('idUserText').getValue();
			// Get the Request Data & create a deep copy of object for further processing.
			var aRequest = jQuery.extend(true, {}, this._oEditProcessObjectModel.getProperty("/"));

			//exit if not action is provided
			if (!sAction) {
				return null;
			}
			// Retrieving the header notes as they are not bound by any field
			aRequest.HeaderText = headerText;

			// Pass the receiver at the Request Level only if the request type is not 'Uniform Return' or the Action is not 'Cancel'
			if (aRequest.Request.TypeId !== Config.constants.ReturnTypeId || sAction !== Config.constants.CancelAction) {
				if (this._sReceiverId && this._sReceiverName) {
					// Transfer the receiver chosen by the User
					aRequest.Request.ReceiverId = this._sReceiverId;
					aRequest.Request.Receiver = this._sReceiverName;
				} else {
					// The user may directly submit without explicitly choosing a receiver
					// in that case pass the 'For' Employee details from Request Header
					aRequest.Request.ReceiverId = aRequest.Request.ForId;
					aRequest.Request.Receiver = aRequest.Request.For;
				}
			}

			aRequest.Request.Action = sAction;

			// Remove the item sizes array and other properties
			for (var i = 0; i < aRequest.Request.RequestItems.length; i++) {
				//  If the the action issue or return, then we need to put the receiver also only if receiver is needed
				// also we need to convert the Alteration Date to GMT Timezone before passing
				if (sAction === Config.constants.UpdateAction) {
					if (aRequest.Request.RequestItems[i].AlterationDate) {
						// Convert the alteration date to GMT timezone
						aRequest.Request.RequestItems[i].AlterationDate = Utils.convertToGMTDate(aRequest.Request.RequestItems[i].AlterationDate);
					}

					// Copy back the data to properties before sending the backend call
					aRequest.Request.RequestItems[i].PickupQuantity = parseInt(aRequest.Request.RequestItems[i].ViewPickupQuantity, 10);
					aRequest.Request.RequestItems[i].ExchangeQuantity = parseInt(aRequest.Request.RequestItems[i].ViewExchangeQuantity, 10);
					aRequest.Request.RequestItems[i].AlterationQuantity = parseInt(aRequest.Request.RequestItems[i].ViewAlterationQuantity, 10);

				}
				// Remove the extra properties
				this._deleteExtraProperties(aRequest.Request.RequestItems[i]);
			}
			return aRequest;
		},

		/**
		 * Delete the extra properties from RequestItem Object
		 * @param  {Object} oRequestItem Item from which the property has to be deleted
		 * @private
		 */
		_deleteExtraProperties: function(oRequestItem) {
			var NoOfAlterationItems = 0;
			// Delete the un-wanted properties
			delete oRequestItem.ItemSizes;
			// Delete the value state and texts for the quantity fields from the Request Item level
			delete oRequestItem.PickUpValueState;
			delete oRequestItem.PickUpValueStateText;
			delete oRequestItem.ExchangeValueState;
			delete oRequestItem.ExchangeValueStateText;
			delete oRequestItem.AlterationValueState;
			delete oRequestItem.AlterationValueStateText;
			// Delete the dummy quantities from UI added for Custom Tailoring
			delete oRequestItem.ViewPickupQuantity;
			delete oRequestItem.ViewExchangeQuantity;
			delete oRequestItem.ViewAlterationQuantity;
			// Addtional fields which were needed for Instock Quantity fetch
			delete oRequestItem.ValuationType;
			delete oRequestItem.ItemUsage;

			delete oRequestItem.UsedStorageLocations;
			delete oRequestItem.UnusedStorageLocations;

			// Loop and delete the additional property created for the alteration fragment
			if (oRequestItem.AlterationItems && oRequestItem.AlterationItems.constructor === Array) {
				NoOfAlterationItems = oRequestItem.AlterationItems.length;
				for (var i = 0; i < NoOfAlterationItems; i++) {
					delete oRequestItem.AlterationItems[i].AlterationItemToggle;
				}
			}
		},

		/**
		 * Initiate the model request for taking action on the Request
		 * @param  {JSON} postData Data for which the request has to be Issues or returned / Cancelled
		 * @private
		 */
		_sendPostRequest: function(postData) {

			var oModel = this.getView().getModel();
			var oViewModel = this.getModel("processObjectView");

			if (!postData) {
				// return if no data is provided to be saved
				return null;
			}

			// Get the Request Data in PostData Object
			postData = postData.Request;

			oViewModel.setProperty("/busy", true);
			oModel.create("/Requests", postData, {
				success: this._onPostSuccess.bind(this),
				error: this._onPostError.bind(this)
			});
		},

		/**
		 * Success handler for the 'Post' of a request
		 * @param  {Object} oData  Data which was saved
		 * @param  {Object} oResponse Response object from the backend
		 * @private
		 */
		_onPostSuccess: function(oData, oResponse) {

			var oViewModel = this.getModel("processObjectView");

			var bReplace = true;

			var sMessage = Utils.parseODataMessage(oResponse);

			MessageToast.show(sMessage, {
				closeOnBrowserNavigation: false,
				duration: 3500
			});
			// Unbusy the view
			oViewModel.setProperty("/busy", false);
			this._resetData();
			// Navigate to worklist screen
			this._navigateBack();

		},
		/**
		 * Error handler for the 'Post' of a request		 
		 * @param  {Object} oResponse Response object from the backend
		 * @private
		 */
		_onPostError: function(oResponse) {

			var oViewModel = this.getModel("processObjectView");
			oViewModel.setProperty("/busy", false);
			//refreshing the screen, since there odata structure was changed before sending the request
			// hence the view needs to be refreshed.
			this.onRefresh();
		},

		/**
		 * Reset model's data
		 * @private
		 */
		_resetData: function() {
			// Reset the entire model to an empty object
			this._oEditProcessObjectModel.setData({});
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectPath = "/Requests(RequestId='" + oEvent.getParameter("arguments").objectId + "')";
			// Unset the dirty flag on UI
			Utils.setUIDirty(false);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());
			// Reset the UI Validation Map object
			Config.InvalidUIMap = {};
			this.byId('idProcessRequestIconTabBar').setSelectedKey("Detail");

			this._bindView(sObjectPath);
		},
		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath) {
			var oTable = this.byId('idProceessRequestTable');
			var processObjectModel = this._oEditProcessObjectModel;
			var oModel = this.getView().getModel();
			var mParams = {};
			var oViewModel = this.getModel("processObjectView");
			mParams = {
				urlParameters: {
					"$expand": ["RequestItems/ItemSizes", "RequestItems/AlterationItems", "RequestItems/StorageLocations"]
				},
				success: this._bindViewSuccess.bind(this)
			};
			oModel.read(sObjectPath, mParams);
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						this.getOwnerComponent().oWhenMetadataIsLoaded.then(function() {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					}.bind(this),
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		/**
		 * Handler for Mapping the OData results to the JSON data model.
		 * @param  {Object} oRequest Request with its details
		 * @private
		 */
		_bindViewSuccess: function(oData) {
			var oProcessObjectController = this;
			var oRequest = Utils.mapDataToRequest(oData);
			oProcessObjectController._updateListWithRequests(oRequest);
			// Control the enabled property of 'Cancel' button on UI
			// Cancel will only be enabled if user selects any checkbox from UI
			this._updateViewModelProperty("/bCancelEnable", false);

			// Control the enabled property of 'Submit' button on UI
			// The 'Submit' should be disabled in following cases -
			// 1. Request is already 'Cancelled' or 'Sent for Approval' - 'Editable' flag is set based on these conditions
			if (!oRequest.Editable) {
				this._updateViewModelProperty("/bSubmitEnable", false);
			} else {
				this._updateViewModelProperty("/bSubmitEnable", true);
			}

			// Control the visibility of Over Flow Tool Bar which
			// has 'Final Settlement' and 'Receiver' checkbox
			this._TableHeaderOverflowToolbarVisible(oRequest);
		},

		/**
		 * Control the visibility of Over Flow Tool Bar which
		 * has 'Final Settlement' checkbox and 'Receiver' input
		 * @param  {Object} oRequest Request with its details
		 * @private
		 */
		_TableHeaderOverflowToolbarVisible: function(oRequest) {
			if (oRequest.CategoryId !== Config.constants.ReturnCategoryId) {
				// Receiver has to be shown so OverFlow Toolbar has to be shown
				this._updateViewModelProperty("/bOverFlowToolBarVisible", true);
			} else {
				// Check the Request type
				// If Type is not End Of Service hide the OverFlow Tool bar
				if (oRequest.TypeId !== Config.constants.EndOfServiceType) {
					this._updateViewModelProperty("/bOverFlowToolBarVisible", false);
				} else {
					// Check the status of Request
					if (oRequest.StatusId !== Config.constants.ReturnedStatusId) {
						this._updateViewModelProperty("/bOverFlowToolBarVisible", true);
					} else {
						this._updateViewModelProperty("/bOverFlowToolBarVisible", false);
					}
				}
			}

		},

		/**
		 * Put all the Requests, thier items and sizes
		 * in the request model of the view.
		 * @param  {Object} oRequest Request with its details
		 * @private
		 */
		_updateListWithRequests: function(oRequest) {
			if (!oRequest || !(oRequest.constructor === Object) || oRequest.length <= 0) {
				// Request Details is not found
				return null;
			}
			// Bind the data to the JSON model which will be used in view
			this._oEditProcessObjectModel.setProperty("/Request", oRequest);
		},

		/**
		 * Triggers to update the binding
		 * @private
		 */
		_onBindingChange: function() {
			var oView = this.getView(),
				oViewModel = this.getModel("processObjectView"),
				oElementBinding = oView.getElementBinding();

			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.RequestId,
				sObjectName = oObject.Type;

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			// Everything went fine.
			oViewModel.setProperty("/busy", false);
		},

		/**
		 * Update View model's property with the specific needed value
		 * @param  {String} sProperty Property to be udpated
		 * @param  {String} sValue    Value for the property
		 * @private
		 */
		_updateViewModelProperty: function(sProperty, sValue) {
			this.getModel('processObjectView').setProperty(sProperty, sValue);
		},

		/**
		 * Method to capture the sign
		 * @private
		 */
		_captureSign: function() {
			// Invoke the ePad method to capture signature
			//ePadUtils.startSign(this, this._captureSignSuccess);
			ePadUtils.startSign()
			  .done(this._captureSignSuccess.bind(this))
			    .fail(this._captureSignError.bind(this));
		},
		/**
		 * Handler for successful sign capture from ePad
		 * @param {data} Signature of user
		 * @private
		 */
		_captureSignSuccess: function(data) {
			//set signature raw data in the model for post
			var aRequest = this._oEditProcessObjectModel.getData();
			// Retrieving the header notes as they are not bound by any field
			aRequest.Request.SignatureData = data;
			this._submitChanges();
		},

		/**
		 * Callback for error during sign capture from ePad
		 * @param {object} oError Error object received from SigCaptureWeb_SignResponse event of ePad
		 */
		_captureSignError : function (oError) {
			MessageBox.show(oError.Message, {
					icon: sap.m.MessageBox.Icon.ERROR
				});
		},
		/**
		 * Function to get the Instock quantity value form backend
		 * @param {Object} oControl Source of event
		 * @param {String} sRequestId Request Id
		 * @param {String} sItemInstockQuantity InStcok Quantity path
		 * @private
		 */
		_getInstockQuantity: function(oControl, sRequestId, sItemInstockQuantity) {

			// Create Data Object
			// Fetch the input values for Function Import which will read the instock quantities
			var oParams = {
				"ItemId": oControl.getBindingContext('processObjectModel').getProperty("NewItemId"),
				"StorageLocationId": oControl.getBindingContext('processObjectModel').getProperty("StorageLocationId"),
				"ItemUsage": oControl.getBindingContext('processObjectModel').getProperty("ItemUsage"),
				"RequestId": sRequestId,
				"ValuationType": oControl.getBindingContext('processObjectModel').getProperty("ValuationType")
			};

			// Invoke the Call Function which fetches the latest Instock Quantity
			this.getModel().callFunction("/GetInstockQuantity", {
				"method": "GET",
				"urlParameters": oParams,
				success: function(oData, response) {
					this._oEditProcessObjectModel.setProperty(sItemInstockQuantity, response.data.InstockQuantity);
				}.bind(this),
				error: function(response) {
					// Refresh the screen in case of exception
					this.onRefresh();
				}.bind(this)
			});

		}

	});
});
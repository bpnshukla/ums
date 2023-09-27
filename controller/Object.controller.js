/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/cdp/ums/managerequests/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/m/MessageBox",
	"sap/cdp/ums/managerequests/utils/config",
	"sap/cdp/ums/managerequests/utils/utilFunctions",
	"sap/cdp/ums/managerequests/controller/ValueHelpDialog.controller",
	"sap/cdp/ums/managerequests/model/formatter",
	"sap/ui/unified/FileUploaderParameter",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, History, Filter,
	MessageBox, Config, Utils, ValHelpDiagController, formatter, FileUploaderParameter, MessageToast) {
	"use strict";
	return BaseController.extend("sap.cdp.ums.managerequests.controller.Object", {
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
					busy: false,
					delay: 0,
					bSpecialRequest: false,
					bThirdPartyRequest: false,
					bAllExpanded: false,
					bApproverVisible: false, // Since initially the request type will be 'Purchase' hence approver should not be visible
					bAddEmployee: true, // By Default the 'Add Employee' button will be enabled
					bPurchaseRequest: true, // By Default the request type selected would be Purchase
					bEmployeesSelected: false,
					bUIDirty: Config.variables._IsUIDirty,
					sReturnCategory: Config.constants.ReturnCategoryId,
					sReturnType: Config.constants.ReturnTypeId
				});

			this._oRequestEmpModel = new JSONModel({
				TypeId: "",
				EventCodeId: "",
				SetcodeId: "",
				CostcenterId: "",
				Vendor: "",
				PlantId: "",
				HasAttachments: false
			});

			this._sSearchVal = "";
			this._sValueHelpFrag = "ValueHelpDialog";
			this._sItemTextFrag = "ItemText";
			this._oSearch = this.byId("idSearch");
			this._oVendor = this.byId("idVendor");
			this._vBox = this.byId("idVBoxEntitlements");

			this._sNameSelectEmployees = "requestEmployees";
			this.getView().setModel(this._oRequestEmpModel, this._sNameSelectEmployees);

			// If the view is loaded for an existing request in draft mode then
			// Change the view's binding to that particular Request's
			this.getRouter().getRoute("draftobject")
				.attachPatternMatched(this._onDraftObjectMatched, this);

			// If the view is loaded for a creating a New Request  then
			// clean the view's bindings with empty view
			this.getRouter().getRoute("newobject")
				.attachPatternMatched(this._onNewObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

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
		 * Event handler for adding more employees to the request
		 * @param  {sap.ui.base.Event} oControlEvent Source of Event
		 * @public
		 */
		onAdd: function(oControlEvent) {
			// Value Help Dialog Object
			var oValueHelpDialog = {};
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());
			//adding a custom public property to the ValHelpDiagController
			// for the ok buttons
			ValHelpDiagController.processSelected = this._getEntitlements.bind(this);
			ValHelpDiagController.sValueHelpFrag = this._sValueHelpFrag;
			ValHelpDiagController.oController = this; // Pass the View Controller so that it can be used for Approver Validation based on request type

			oValueHelpDialog = Utils.getFreshFragment.call(this,
				this._sValueHelpFrag,
				ValHelpDiagController);

			this.getView().addDependent(oValueHelpDialog);
			oValueHelpDialog.setModel(this.getView().getModel());
			oValueHelpDialog.setMultiSelect(true);
			oValueHelpDialog._dialog.setType('Message');
			oValueHelpDialog.open();
		},
		/**
		 * Handler for (Expand All / Collapse All) Button
		 * @public
		 */
		onExpand: function() {
			this._updatePanelExpandState();
		},
		/**
		 * Event handler for deleting employees from the request
		 * @param {sap.ui.base.Event} oControlEvent Source of Event
		 * @public
		 */
		onDeleteEmployee: function(oControlEvent) {
			var oContext = oControlEvent.getSource().getBindingContext(this._sNameSelectEmployees);
			var context = this;
			//confirm the deletion
			Utils.showConfirmationDialog
				.call(this, this.getResourceBundle()
					.getText("confirmDelete"), this.getResourceBundle()
					.getText("dlgConfirm"), this._removeEmployees.bind(oContext, context));
		},
		/**
		 * Handler for message popover button
		 * @param  {sap.ui.base.Event} oControlEvent Source of Event
		 * @public
		 */
		onMessagePopPress: function(oControlEvent) {
			Utils.showMessgePopover(oControlEvent.getSource());
		},

		/**
		 * Event handler for change in Request Type
		 * @param {sap.ui.base.Event} oControlEvent Source of Event
		 * @public
		 */
		onRequestTypeChange: function(oControlEvent) {

			var oSelectedItem = {};
			// The setting of dirty in F4 helps can be removed after discussion
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			oSelectedItem = oControlEvent.getSource().getSelectedItem();
			// No validation needed for the selected item, as this is a select control
			// and the values would always be from the list
			this._updateRequestType(oSelectedItem);
			// Update and show the approver based on request type
			this._updateApproverVisible(oSelectedItem);
			this._updateThirdPartyRequest(oSelectedItem);
			// On every change of the drop down value,
			// there has to be an update of the entitlements also
			this._refreshEntitlements();
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
			var sPath = oControl.getBindingContext('requestEmployees').getPath();

			var sItemInstockQuantity = sPath + "/InstockQuantity";
			var sNewItemId = sPath + "/NewItemId";
			var sPrice = sPath + "/Price";
			var sCurrency = sPath + "/Currency";
			// Below property(ies) need to be updated so that the Text control has correct values shown
			var sSize = sPath + "/Size";

			var sItemInstockQuantityValue = oControl.getSelectedItem().getBindingContext('requestEmployees').getProperty("InstockQuantity");
			var sNewItemIdValue = oControl.getSelectedKey();
			var sItemPriceValue = oControl.getSelectedItem().getBindingContext('requestEmployees').getProperty("Price");
			var sItemCurrencyValue = oControl.getSelectedItem().getBindingContext('requestEmployees').getProperty("Currency");

			var sItemSizeValue = oControl.getSelectedItem().getBindingContext('requestEmployees').getProperty("SizeDesc");

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			this._oRequestEmpModel.setProperty(sItemInstockQuantity, sItemInstockQuantityValue);
			this._oRequestEmpModel.setProperty(sNewItemId, sNewItemIdValue);
			this._oRequestEmpModel.setProperty(sPrice, sItemPriceValue);
			this._oRequestEmpModel.setProperty(sCurrency, sItemCurrencyValue);

			this._oRequestEmpModel.setProperty(sSize, sItemSizeValue);
		},

		/**
		 * On Press of Header Notes Button
		 * @param {sap.ui.base.Event} oEvent The source of the Event
		 * @public
		 */
		onHeaderCommentPress: function(oEvent) {

			var itemText = this.getModel('requestEmployees').getProperty("/HeaderText");

			var oItemTextPopOver = Utils.getFreshFragment.call(this, this._sItemTextFrag);

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			this.getView().addDependent(oItemTextPopOver);
			oItemTextPopOver.getContent()[0].setValue(itemText);
			oItemTextPopOver.setPlacement(sap.m.PlacementType.Auto);
			oItemTextPopOver.openBy(oEvent.getSource());

			// Hide the old notes textbox in case of New Request
			// If the Request Id is missing then its a new request			
			if (this._oRequestEmpModel.getData().RequestId === "") {
				oItemTextPopOver.getContent()[0].setVisible(false);
			}

		},
		/**
		 * Handles the Items comment changes
		 * @param {sap.ui.base.Event} oEvent The source of the Event	
		 * @public	 		
		 */
		onItemCommentChange: function(oEvent) {
			var oControl = oEvent.getSource();

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			this._oRequestEmpModel.setProperty('/HeaderText', oControl.getValue());
		},
		/**
		 * Event handler for validating the Order Quantity Change
		 * Validates the Order Quantity such that it is less than Remaining quantity
		 * @param  {sap.ui.base.Event} oControlEvent The source of the Event
		 * @public	 
		 */
		onOrderQuantityChange: function(oControlEvent) {

			var oContext = oControlEvent.getSource().getBindingContext("requestEmployees");
			var sPath = oContext.getPath("OrderQuantity");
			var sOrderQty = oContext.getProperty("OrderQuantity");
			var sRemainingQty = oContext.getProperty("RemainingQuantity");
			// Check the number validity and set value state text
			// If wrong parameters are passed then the input control will not have any Value State information
			// and the program will dump with an error logged in console
			var oStateInformation = Utils.validateQuantity(oControlEvent.getSource().getValue(), sOrderQty, sRemainingQty);

			var sProperty = oContext.getPath() + "/OrderValueState";
			var sPropertyText = oContext.getPath() + "/OrderValueStateText";
			var sValueState = sap.ui.core.ValueState.None;

			// Determine the value state text - only if its a postive number
			if (oStateInformation.sValueStateText === "") {
				oStateInformation.sValueStateText = "orderQuantityErrorText";
			}

			if (!oStateInformation.bValid) {
				sValueState = sap.ui.core.ValueState.Error;
				// clear the value in control
				// Directly setting via oControlEvent.getSource().setValue() was not working
				// so set the property in model - below works only first time next time if value is null
				// it does not work - Needs discussion
				//this._oRequestEmpModel.setProperty(sPath,null);
				oControlEvent.getSource().setValue("");
			}

			// Set Value State
			this._oRequestEmpModel.setProperty(sProperty, sValueState);

			// Set Value State Text
			this._oRequestEmpModel.setProperty(sPropertyText, this.getResourceBundle().getText(oStateInformation.sValueStateText));

			// Call function to set validation state
			Utils.setUIValidationState(sPath, sProperty, oStateInformation.bValid);

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

		},
		/**
		 * Event handler for change in Event Code Type
		 * @param {sap.ui.base.Event} oControlEvent The source of the Event
		 * @public	 
		 */
		onEventCodeChange: function(oControlEvent) {
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			var oSelectedItem = oControlEvent.getSource().getSelectedItem();
			// Re obtain tje entitlements
			this._refreshEntitlements();
		},

		/**
		 * Event handler for change in Cost Center
		 * @param {sap.ui.base.Event} oControlEvent The source of the Event
		 * @public	 
		 */
		onCostCenterChange: function(oControlEvent) {
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			Utils.validateComboValue.call(this, oControlEvent);
		},
		/**
		 * Event handler for change in Plant
		 * @param {sap.ui.base.Event} oControlEvent The source of the Event
		 * @public	 
		 */
		onPlantChange: function(oControlEvent) {
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			Utils.validateComboValue.call(this, oControlEvent);
		},
		/**
		 * Event handler for change in Vendor
		 * @param {sap.ui.base.Event} oControlEvent The source of the Event
		 * @public	 
		 */
		onVendorChange: function(oControlEvent) {
			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			//Update the vendor in the JSON Model
			this.getModel("requestEmployees").setProperty("/Vendor", oControlEvent.getSource().getSelectedKey());
		},
		/**
		 * Event handler for toggling all the Panels
		 * @param  {sap.ui.base.Event} oControlEvent The source of the Event
		 * @public	 
		 */
		onToggleAllExpand: function(oControlEvent) {
			var oPanels = this._getAllPanels();
			var bAllExpanded = this._getViewModelProperty('/bAllExpanded');
			var noOfPanels = oPanels.length;
			// Toggle the state of Expand/Collapse Button
			this._updateViewModelProperty('/bAllExpanded', !bAllExpanded);

			for (var i = 0; i < noOfPanels; i++) {
				oPanels[i].setExpanded(!bAllExpanded);
			}
		},

		/**
		 * Event handler for Submit button
		 * @param  {sap.ui.base.Event} oControlEvent oControlEvent The source of the Event
		 * @public	 
		 */
		onSubmit: function(oControlEvent) {
			// Check the state of UI - In case of Invalid UI don't show Receipt Popover
			if (Object.keys(Config.InvalidUIMap).length) {
				MessageBox.show(this.getResourceBundle().getText("invalidUIError"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			} else {
				Utils.showConfirmationDialog
					.call(this, this.getResourceBundle()
						.getText("confirmSubmit"), this.getResourceBundle()
						.getText("dlgConfirm"), this._submitChanges);
			}
		},

		/**
		 * Event handler for Save button
		 * @param  {sap.ui.base.Event} oControlEvent oControlEvent The source of the Event
		 * @public	 
		 */
		onSave: function(oControlEvent) {
			// Check the state of UI - In case of Invalid UI don't show Receipt Popover
			if (Object.keys(Config.InvalidUIMap).length) {
				MessageBox.show(this.getResourceBundle().getText("invalidUIError"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			} else {
				Utils.showConfirmationDialog.call(this, this.getResourceBundle()
					.getText("confirmSave"), this.getResourceBundle()
					.getText("dlgConfirm"),
					this._saveChanges);
			}
		},
		/**
		 * Event handler for Cancel button
		 * @param  {sap.ui.base.Event} oControlEvent oControlEvent The source of the Event
		 * @public	 
		 */
		onCancel: function(oControlEvent) {
			Utils.showConfirmationDialog.call(this, this.getResourceBundle()
				.getText("confirmCancel"), this.getResourceBundle()
				.getText("dlgConfirm"), this._cancelChanges(Config.constants.Ok));
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Set the default entitlement category - purchase
		 * @private
		 */
		_setDefaultRequestType: function() {
			this.byId("idRequestType").setSelectedKey(Config.constants.PurchaseRequestId);
		},
		/**
		 * updates the  request property based on the selectedItemId
		 * @param  {sap.ui.core.Item} oSelectedItem The Selected Item
		 * @private
		 */
		_updateRequestType: function(oSelectedItem) {
			// Update the Special Request type in the View Model
			var bSpecialRequest =
				(oSelectedItem.getKey() === Config.constants.SpecialRequestId) ?
				true : false;
			// Update the Purchase Request Type
			var bPurchaseRequest = (oSelectedItem.getKey() === Config.constants.PurchaseRequestId) ?
				true : false;

			this._updateViewModelProperty("/bSpecialRequest", bSpecialRequest);
			this._updateViewModelProperty("/bPurchaseRequest", bPurchaseRequest);
		},
		/**
		 * updates the  visibility of approver in employee select fragment
		 * based on the selectedItemId
		 * @param  {sap.ui.core.Item} oSelectedItem The selected item
		 * @private
		 */
		_updateApproverVisible: function(oSelectedItem) {

			// Approver column should be visible only for the below five request types
			var bApproverVisible = (oSelectedItem.getKey() === Config.constants.SpecialRequestId ||
				oSelectedItem.getKey() === Config.constants.DamageByThirdPartyTypeId ||
				oSelectedItem.getKey() === Config.constants.LossByThirdPartyTypeId ||
				oSelectedItem.getKey() === Config.constants.LossOnDutyTypeId ||
				oSelectedItem.getKey() === Config.constants.DamageOnDutyTypeId) ? true : false;

			this._updateViewModelProperty("/bApproverVisible", bApproverVisible);
		},
		/**
		 * updates the third party request property based on the selectedItemId
		 * @param  {sap.ui.core.Item} oSelectedItem The Selcted Item
		 * @private
		 */
		_updateThirdPartyRequest: function(oSelectedItem) {
			// Update the Third Party Request Property
			var bThirdPartyRequest =
				(oSelectedItem.getKey() === Config.constants.DamageByThirdPartyTypeId ||
					oSelectedItem.getKey() === Config.constants.LossByThirdPartyTypeId) ?
				true : false;

			this._updateViewModelProperty("/bThirdPartyRequest", bThirdPartyRequest);
			// In case of 'Damage By third Party/Loss by Third Party', pass vendor information too
			if (bThirdPartyRequest === true) {
				this.getModel("requestEmployees").setProperty("/Vendor", this._oVendor.getSelectedKey());
			}
		},

		/**
		 * refresh the entitlements based on the Request Employee and type		 
		 * @private
		 */
		_refreshEntitlements: function() {
			// get all the employees
			var aEmployees = this._oRequestEmpModel.getProperty("/RequestEmployees");
			if (aEmployees && aEmployees.constructor === Array && aEmployees.length > 0) {
				// Busy the view and fetch entitlements for all the selected employees
				this._updateViewModelProperty("/busy", true);
				this._getEntitlements(aEmployees);
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

			// Initialize the View Model
			this._initializeViewModel();
			this._clearRequestModel();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history				
				this.getRouter().navTo("worklist", {}, bReplace);
			}

		},
		/**
		 * Gathers the screen data and initates the 'save'call
		 * @private
		 */
		_saveChanges: function() {
			var bAllowBackendCall = this._validateApprovers();
			var oJSONData = {};
			// Invoke the backend call with the post data
			if (bAllowBackendCall) {
				oJSONData = this._getDataToSent(Config.constants.SaveAction);
				this._checkAttachments(oJSONData);
				//this._sendPostRequest(oJSONData);
			}
		},

		/**
		 * Gathers the screen data and initates the 'submit' call
		 * @private
		 */
		_submitChanges: function() {
			var bAllowBackendCall = this._validateApprovers();
			var oJSONData = {};
			// Invoke the backend call with the post data
			if (bAllowBackendCall) {
				oJSONData = this._getDataToSent(Config.constants.SubmitAction);
				this._checkAttachments(oJSONData);
				//this._sendPostRequest(oJSONData);
			}
		},
		
		_checkAttachments: function(oJSONData){
			var sFileMismatch = this.handleFileMismatch();
			if (this._oRequestEmpModel.getData().TypeId === Config.constants.DamageByThirdPartyTypeId && oJSONData.HasAttachments===false ||
				this._oRequestEmpModel.getData().TypeId === Config.constants.LossByThirdPartyTypeId &&  oJSONData.HasAttachments===false ||
				this._oRequestEmpModel.getData().TypeId === Config.constants.DamageOnDutyTypeId &&  oJSONData.HasAttachments===false ||
				this._oRequestEmpModel.getData().TypeId === Config.constants.LossOnDutyTypeId &&  oJSONData.HasAttachments===false) {
				
				MessageBox.show(
							this.getResourceBundle().getText("errorMessageAttachment"), {
								icon: MessageBox.Icon.ERROR,
								title:this.getResourceBundle().getText("errorTitle"),
								actions: [MessageBox.Action.OK],
							}
						);
				return;
			}
			if(sFileMismatch !== ""){
						MessageBox.show(
							this.getResourceBundle().getText("filemismatcherror", sFileMismatch), {
								icon: MessageBox.Icon.ERROR,
								title:this.getResourceBundle().getText("errorTitle"),
								actions: [MessageBox.Action.OK],
							}
						);
						return;
			}
			
			var iAttachmentSize = this._handleAttachSize();
			if(iAttachmentSize >= 9){
				//show error popup
				MessageBox.show(this.getResourceBundle().getText("attachmentFileSizeError"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
			}else{
					this._sendPostRequest(oJSONData);
			}
		},
		
		handleFileMismatch: function(){
			var oUpldCollection = this._vBox.getItems()[0].getContent()[0].getAggregation("_header")
										.getItems()[1].getContent()[0];
											
			//check if the attachments exceeds size 9Mb							
			var aItems = oUpldCollection.getItems();
			var aMismatchTypes = [];
			for(var i=0; i<aItems.length; i++){
				var aFileType = ["bmp", "jpg", "jpeg", "png", "csv", "xls", "xlsx", 
							"doc", "docx", "odt", "pdf", "ppt", "pptx", "txt"];
				var sFileName = aItems[i].getFileName();
				var sFileType = sFileName.split(".").pop().toLowerCase();
				var iIndex = aFileType.indexOf(sFileType);
				if(iIndex === -1){
					aMismatchTypes.push(sFileType);
					break;
				}
			}
			if(aMismatchTypes.length > 0){
				return aMismatchTypes[0];
			}else{
				return "";
			}
		},
		
		_handleAttachSize: function(){
				var oUpldCollection = this._vBox.getItems()[0].getContent()[0].getAggregation("_header")
										.getItems()[1].getContent()[0];
											
				//check if the attachments exceeds size 9Mb							
				var aItems = oUpldCollection.getItems();
				var iTotalSize = 0;
				for(var i=0; i<aItems.length; i++){
					var sFileSize = aItems[i].getAttributes()[0].getText();
					var sFSize = sFileSize.split(" ")[0].replace(",",".");
					if(sFileSize.indexOf("KB") !== -1 ){
						sFSize = (sFSize/(1024)).toFixed(2);
					}else if(sFileSize.indexOf("Bytes") !== -1){
						sFSize = (sFSize/(1024 * 1024)).toFixed(2);
					}
					var iFileSize = parseFloat(sFSize);
					iTotalSize = iTotalSize + iFileSize;
				}
				return iTotalSize;
		},
		
		/**
		 * Validate the approvers for all the employees
		 * @return {Boolean} [bAllowBackendCall] - Indicate whether backend call should be allowed or not
		 * @private
		 */
		_validateApprovers: function() {
			// Validate for same approvers based on the five request types -> Special Need, Loss on Duty/Third Party, Damage on duty/Third Party
			var aApprovers = [],
				bAllowBackendCall = true;
			if (this.getModel('objectView').getProperty('/bApproverVisible')) {
				// Get the approvers for already existing employees
				aApprovers = Utils.collectExistingEmpApprovers(this);

				if (!Utils.checkSameApprovers(aApprovers)) {
					MessageBox.show(this.getResourceBundle().getText("approverMismatch"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
					bAllowBackendCall = false;
				} else {
					bAllowBackendCall = true;
				}
			}
			return bAllowBackendCall;
		},
		/**
		 * Handler for cancel changes
		 * @param {String} [sAction] The action which triggered this function call
		 * @private
		 */
		_cancelChanges: function(sAction) {
			if (sAction === Config.constants.Ok) {
				this._clearRequestModel();
				//Nave back to the worklist view or the hsitory -1
				this._navigateBack();
			}
		},

		/**
		 * Gets all the data to be sent in the save/Update Request
		 * @param {String} [sAction] The action which triggered this function call
		 * @return {Object} [oData] - The Model Data
		 * @private
		 */
		_getDataToSent: function(sAction) {
			var bValidData = true;
			//exit if not action is provided
			if (!sAction) {
				return null;
			}

			// Validate the order quantity
			bValidData = this._validateRequestQuantity();

			if (!bValidData) {
				return null;
			}

			// Since /Employees[] and RequestId is already 2-way bound to the ;
			// list, hence not retrieving it here.
			this._oRequestEmpModel.setProperty("/Action", sAction);
			this._oRequestEmpModel.setProperty("/TypeId", this._getRequestType());
			this._oRequestEmpModel.setProperty("/EventCodeId", this._getEventCode());
			// Below logic of setcode is not needed right now but it has not
			// been commented because it may be needed in future
			this._oRequestEmpModel.setProperty("/SetcodeId", this._getSetCode());
			this._oRequestEmpModel.setProperty("/CostcenterId", this._getCostCostcenter());
			this._oRequestEmpModel.setProperty("/PlantId", this._getPlant());

			var hasAttachments = false;
			var files;			
			var oUploadCollection;

			// Loop and traverse every employee
			for (var i = 0; i < this._oRequestEmpModel.getData().RequestEmployees.length; i++) {
							
				//get the upload collection instance for an employee
				oUploadCollection = this._vBox.getItems()[i].getContent()[0].getAggregation("_header").
				getItems()[1].getContent()[0];

				files = oUploadCollection.getItems();	

				if (files && files.length > 0) {
					//check if there is even a single attachment in the request
					if (hasAttachments === false) {												
						hasAttachments = true;
					}
				}				

				// Loop and traverse the items in every employee
				for (var j = 0; j < this._oRequestEmpModel.getData().RequestEmployees[i].RequestEmployeeEntitlements.length; j++) {

					// delete the extra properties like OrderValueState and OrderValueStateText
					this._deleteExtraProperties(this._oRequestEmpModel.getData().RequestEmployees[i].RequestEmployeeEntitlements[j]);
				}
			}

			this._oRequestEmpModel.setProperty("/HasAttachments", hasAttachments);

			// Remove the Vendor information from all request types except 
			// Damage by Third Party and Loss by Third Party
			if (this._oRequestEmpModel.getData().TypeId !== Config.constants.DamageByThirdPartyTypeId &&
				this._oRequestEmpModel.getData().TypeId !== Config.constants.LossByThirdPartyTypeId) {
				// Empty the Vendor
				this._oRequestEmpModel.getData().Vendor = "";
			}

			return this._oRequestEmpModel.getData();
		},
		/**
		 * Validation function to prevent backend call in case no order quantity is mentioned
		 * @return {Boolean} Indicator informing whether data is valid or not
		 * @private
		 */
		_validateRequestQuantity: function() {
			var iOrderQuantity = 0;

			// Loop and traverse every employee
			for (var i = 0; i < this._oRequestEmpModel.getData().RequestEmployees.length; i++) {
				// Loop and traverse the items in every employee
				for (var j = 0; j < this._oRequestEmpModel.getData().RequestEmployees[i].RequestEmployeeEntitlements.length; j++) {

					// Add all the order quantities
					iOrderQuantity = iOrderQuantity + parseInt(this._oRequestEmpModel.getData().RequestEmployees[i].RequestEmployeeEntitlements[j].OrderQuantity,
						10);
				}
				// Allow backend call only when the user has entered at least
				// one positive 'Order' Quantity  for at every employee
				if (!iOrderQuantity) {
					MessageBox.show(this.getResourceBundle()
						.getText("orderQuantityError"), {
							icon: sap.m.MessageBox.Icon.ERROR
						});
					jQuery.sap.log.error("No Order Quantity is entered");
					return false;
				}
				iOrderQuantity = 0;
			}

			return true;
		},
		/**
		 * Delete the extra properties from RequestEmployeeEntitlements Object
		 * @param  {Object} oRequestEmployeeEntitlement Item from which the property has to be deleted
		 * @private
		 */
		_deleteExtraProperties: function(oRequestEmployeeEntitlement) {
			// Delete the value state and texts for the quantity fields from the Request Employee Entitlement level
			delete oRequestEmployeeEntitlement.OrderValueState;
			delete oRequestEmployeeEntitlement.OrderValueStateText;

		},
		/**
		 * Initiate the model request for creating the Request
		 * @param  {JSON} oJSON Data for which the request has to be created
		 * @private
		 */
		_sendPostRequest: function(oJSON) {
			var oModel = this.getModel();

			if (!oJSON) {
				// return if no data is provided to be saved
				return null;
			}

			this._updateViewModelProperty("/busy", true);

			oModel.create("/Requests", oJSON, {
				success: this._onPostSuccess.bind(this),
				error: this._onPostError.bind(this)
			});
		},
		/**
		 * Error handler for the 'Post' of a request
		 * @param  {Object} oResponse Response coming from backend
		 * @private
		 */
		_onPostError: function(oResponse) {
			// Unbusy the view
			this._updateViewModelProperty("/busy", false);
		},
		/**
		 * Success handler for the 'Post' of a request
		 * @param  {JSON} oData  Data which was saved
		 * @param  {Object} oResponse Response coming from backend
		 * @private
		 */
		_onPostSuccess: function(oData, oResponse) {
			var requestId = oData.RequestId;
			var attachmentsExist = this._oRequestEmpModel.getProperty("/HasAttachments");
			
			//if attachments are available and request was created
			if (oResponse.statusCode === "201" && attachmentsExist === true) {
				this.onUploadAllFiles(oData.RequestEmployees.results)
					.done(this._fileUploadSuccessForAll.bind(this, requestId))
      				.fail(this._fileUploadErrorForAll.bind(this, requestId));
			} 
			else if (attachmentsExist === false) {
				this.getView().setBusy(false);
				this._navigateBack();
			}
		},

		onUploadAllFiles: function(employees) {			
			var index,
				oUploadCollection,
				attachmentsExist,
				requestId,
				employeeId,
				allUploaded = jQuery.Deferred(),
				filePromisesForEmployee = [];

			this._vBox.getItems().map(function (vBox) {
				//set the tab to attachments tab for upload to work
				vBox.getContent()[0].setSelectedKey("Attachment");

				var uploadedForEmployee = jQuery.Deferred();

				index = vBox.getBindingContext("requestEmployees").getPath().slice(18);
				index = parseInt(index);

				requestId = employees[index].RequestId;
				employeeId = employees[index].EmployeeId;								
					
				//find the upload collection
				oUploadCollection = vBox.getContent()[0].getAggregation("_header")
											.getItems()[1].getContent()[0];

				attachmentsExist = oUploadCollection.getItems().length > 0 ? true : false;

				if (attachmentsExist) {
					uploadedForEmployee = Utils.onStartUpload(requestId, employeeId, oUploadCollection);
					filePromisesForEmployee.push(uploadedForEmployee);
				}				
			});		
			jQuery.when.apply(this, filePromisesForEmployee)
             		   .done(function () {
                			allUploaded.resolve();                			
             			})
             			.fail(function () {
             				allUploaded.reject();                			
             			});

  			return allUploaded.promise();							
		},		

		_fileUploadSuccessForAll: function(requestId) {
    		Utils.onTriggerWorkflow(this, requestId)
    		    .done(this._workflowSuccess.bind(this, requestId))
      			.fail(this._workflowError.bind(this, requestId));						    			
		},
		
		_workflowSuccess: function(requestId) {
			this._updateViewModelProperty("/busy", false);
			MessageToast.show(this.getResourceBundle()
						.getText("submitRequestSuccess", requestId), {
							duration: 3500,
							closeOnBrowserNavigation: false
			});
			this._navigateBack();  
		},

		_workflowError: function(requestId) {
			this._updateViewModelProperty("/busy", false);
			MessageToast.show(this.getResourceBundle()
						.getText("workflowError", requestId), {
							duration: 3500,
							closeOnBrowserNavigation: false
			});
			this._navigateBack();
		},

		_fileUploadErrorForAll: function(requestId) {
			this._updateViewModelProperty("/busy", false);
			MessageToast.show(this.getResourceBundle()
						.getText("attachmentError", requestId), {
							duration: 3500,
							closeOnBrowserNavigation: false
			});
			this._navigateBack();
		},

		/**
		 * Get the Event code from the Select
		 * @return {String} sEventCodeId Event Code Id
		 * @private
		 */
		_getEventCode: function() {
			// Get the event code id and return
			var bEventCodeNeeded = this.byId("idEventCode").getVisible();
			var sEventCodeId = (this.byId("idEventCode").getVisible()) ?
				this.byId("idEventCode").getSelectedKey() :
				"";
			return sEventCodeId;
		},

		/**
		 * Get the SetCode from the Select
		 * @return {String} sSetCodeId  Set Code Id
		 * @private
		 */
		_getSetCode: function() {
			var bSetCodeNeeded = this.byId("idSetCode").getVisible();
			//since all the employee would have the same setcode
			//hence retrieving the setcode for the first employee and sending at header leaver
			var sEmpSetCode = this._oRequestEmpModel.getProperty("/RequestEmployees/0/SetcodeId");
			var sSetCodeId = (bSetCodeNeeded) ?
				this.byId("idSetCode").getSelectedKey() :
				sEmpSetCode;
			sSetCodeId = sSetCodeId ? sSetCodeId : "";
			return sSetCodeId;
		},

		/**
		 * Get the Cost Center from the combobox
		 * @return {String} sCostCenterId  Cost Center Id
		 * @private
		 */
		_getCostCostcenter: function() {
			var sCostCenterId = this.byId("idCostCenter").getSelectedKey();
			return sCostCenterId;
		},

		/**
		 * Get the Plant Id from the combobox
		 * @return {String} sPlantId Plant Id
		 * @private
		 */
		_getPlant: function() {
			var sPlantId = this.byId("idPlant").getSelectedKey();
			return sPlantId;
		},

		/**
		 * Get the Request Type from the 'Select'
		 * @return {String} sRequestTypeId Request Type Id
		 * @private
		 */
		_getRequestType: function() {
			var sRequestTypeId = this.byId("idRequestType").getSelectedKey();
			return sRequestTypeId;
		},

		/**
		 * Function for getting the Entitlements for
		 * specific Employees
		 * @param  {Array} aSelectedEmployees Employees for whom the Entitlements have
		 * to be brought form the backend
		 * @private
		 */
		_getEntitlements: function(aSelectedEmployees) {
			var oModel = this.getModel();
			var iLength = aSelectedEmployees.length;
			var i = 0;
			var sPath = "";
			var oParams = {};
			var oFilter = {};
			var aFilters = [];

			// Set the control variable to show the Purchase price column in case Type is Purchase
			var bPurchaseRequest = (this._getRequestType() === Config.constants.PurchaseRequestId) ?
				true : false;

			oModel.setDeferredBatchGroups(["defEmplEntitBatchRead"]);

			this._updateViewModelProperty("/bPurchaseRequest", bPurchaseRequest);

			// Since the get call for entitlements requires RequestType,
			// Hence concatinating the REquestType from the UI to the URL
			for (i = 0; i < iLength; i++) {
				sPath = "/Employees(EmployeeId='" + aSelectedEmployees[i].EmployeeId + "')";

				oFilter = new Filter(Config.constants.EmployeeEntitlementsTypeId,
					sap.ui.model.FilterOperator.EQ,
					this._getRequestType());
				aFilters.push(oFilter);

				oFilter = new Filter(Config.constants.EmployeeEntitlementsSetCodeId,
					sap.ui.model.FilterOperator.EQ,
					this._getSetCode());
				aFilters.push(oFilter);

				oFilter = new Filter(Config.constants.EmployeeEntitlementsEventCodeId,
					sap.ui.model.FilterOperator.EQ,
					this._getEventCode());
				aFilters.push(oFilter);

				oParams = {
					batchGroupId: "defEmplEntitBatchRead",
					filters: aFilters,
					urlParameters: {
						$expand: ["EmployeeEntitlements/ItemSizes"]
					}
				};
				oModel.read(sPath, oParams);
				sPath = "";
				oParams = {};
				oFilter = {};
				aFilters = [];
			}

			oModel.submitChanges({
				batchGroupId: "defEmplEntitBatchRead",
				success: this._onReadEntitlementsComplete.bind(this),
				error: this._onReadEntitlementsError.bind(this)
			});
			this._updateViewModelProperty("/busy", true);
		},

		/**
		 * ODataModel read success handler
		 * @param {Object} oData   Backend Data
		 * @param  {Object} oResponse Backend Response		 
		 * @private
		 */

		_onReadEntitlementsComplete: function(oData, oResponse) {
			var aEmployees = [];
			if (!oData) {
				return jQuery.sap.log.error("No data retrieved");
			}
			//Unbusy the view after the addition of employees
			this._updateViewModelProperty("/busy", false);
			aEmployees = Utils.mapEmpEntitlements(oData, this._oRequestEmpModel.getProperty("/RequestId"));
			// Update the View with the enployees
			this._updateListWithEmployees(aEmployees, true);

		},

		/**
		 * ODataModel read failure handler
		 * @param {sap.ui.base.Event} oEvent
		 * @param  {Json} oData Set of Employees and their corresponding
		 * Entitlements
		 * @private
		 */
		_onReadEntitlementsError: function(oResponse) {
			jQuery.sap.log.error(oResponse);
			//Unbusy the view after the addition of employees
			this._updateViewModelProperty("/busy", false);
		},
		/**
		 * Binds the view to the object path.		
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onDraftObjectMatched: function(oEvent) {
			var sObjectPath = "";
			// set the page as busy.
			this._updateViewModelProperty("/busy", true);
			// Unset the dirty flag on UI
			Utils.setUIDirty(false);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());
			//set the visibility for existing attachments
			this.getView().byId('idAttachedFiles').setVisible(true);
			sObjectPath = "/Requests(RequestId='" + oEvent.getParameter("arguments").objectId + "')";
			this._bindView(sObjectPath);
		},

		/**
		 * Binds the view to the New Object path.		 
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onNewObjectMatched: function(oEvent) {
			// Unset the dirty flag on UI
			Utils.setUIDirty(false);
			// Control the enabled property of 'Cancel' button on UI
			this._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			//clear the bindings for new Request
			this._clearBindings();
			this.byId("idObjectPage").setTitle(this.getResourceBundle()
				.getText("newObjectTitle"));
			// Set Purchase as the Default Request type
			this._setDefaultRequestType();
		},

		/**
		 * Clear the previous bindings of the view for new Request Creation
		 * @private
		 */
		_clearBindings: function() {
			// Set the selected model Employees flag to false;
			this._updateViewModelProperty("/bEmployeesSelected", false);
			// Empty the Selected model of Employees from ;
			this._updateRequestEmployees([]);
			this._clearRequestModel();
		},

		/**
		 * Reset the Request Model properties
		 * @private
		 */
		_clearRequestModel: function() {
			this._oRequestEmpModel.setProperty("/RequestId", "");
			this._oRequestEmpModel.setProperty("/Action", "");
			this._oRequestEmpModel.setProperty("/TypeId", "");
			this._oRequestEmpModel.setProperty("/EventCodeId", "");
			this._oRequestEmpModel.setProperty("/CostcenterId", "");
			this._oRequestEmpModel.setProperty("/RequestEmployees", "");
			this._oRequestEmpModel.setProperty("/HeaderText", "");
			this.getView().byId('idAttachedFiles').setVisible(false);
		},
		/**
		 * Initialize the View Model
		 * @private
		 */
		_initializeViewModel: function() {
			// Initialize the View Model with default values
			this._updateViewModelProperty("/busy", false);
			this._updateViewModelProperty("/delay", 0);
			this._updateViewModelProperty("/bSpecialRequest", false);
			this._updateViewModelProperty("/bThirdPartyRequest", false);
			this._updateViewModelProperty("/bAllExpanded", false);
			this._updateViewModelProperty("/bPurchaseRequest", true);
			this._updateViewModelProperty("/bUIDirty", Config.variables._IsUIDirty);
			this._updateViewModelProperty("/bApproverVisible", false);
			this._updateViewModelProperty("/bAddEmployee", true);
		},
		/**
		 * Put all the selected employees and their corresponding Entitlements
		 * in the request model of the view.
		 * @param  {Array} aEmployees Set of Employees and their corresponding Entitlements
		 * @param {Boolean} bNewEmployees Indicator for new employees
		 * @private
		 */
		_updateListWithEmployees: function(aEmployees, bNewEmployees) {
			if (!aEmployees || !(aEmployees.constructor === Array) || aEmployees.length < 0) {
				// No employees to be added
				return null;
			}
			//since the setproperty only works with an object and not an array
			//hence assigning the array to an object
			this._updateRequestEmployees(aEmployees, bNewEmployees);
			//Enable the Employee list after the list has been updated with the ;
			//bindings
			this._updateViewModelProperty("/bEmployeesSelected", true);
			// After adding employees control the state of the 'Expand/Collapse All' Button
			this._updatePanelExpandState();
		},
		/**
		 * Update the existing/empty list of employees with added employees
		 * @param  {Array} aValidEmployees Array of already validated new employes
		 * @param {Boolean} bNewEmployees Indicator for new employees
		 * @private
		 */
		_updateRequestEmployees: function(aValidEmployees, bNewEmployees) {
			var aExistingEmployees = this._oRequestEmpModel.getProperty("/RequestEmployees");
			var iUniquelyAddedEmp = 0;

			if (aExistingEmployees && bNewEmployees && aExistingEmployees.constructor === Array && aExistingEmployees.length > 0) {
				aValidEmployees = Utils.removeDuplicateEmployees(aValidEmployees, aExistingEmployees);
			}
			//since the setproperty only works with an object and not an array
			//hence assigning the array to an object ;
			this._oRequestEmpModel.setProperty("/RequestEmployees", aValidEmployees);

			if (aValidEmployees.constructor === Array) {
				iUniquelyAddedEmp = aValidEmployees.length;
			}

			// This method is called initially also when new object is matched and in that case
			// 'MaxAllowedEmp' will be undefined, hence below check
			if (this.MaxAllowedEmp !== undefined) {
				if (iUniquelyAddedEmp < this.MaxAllowedEmp) {
					this._updateViewModelProperty("/bAddEmployee", true);
				} else {
					this._updateViewModelProperty("/bAddEmployee", false);
				}
			}
		},

		/**
		 * Update View model's property with the specific needed value
		 * @param  {String} sProperty Property to be udpated
		 * @param  {String} sValue    Value for the property
		 * @private
		 */
		_updateViewModelProperty: function(sProperty, sValue) {
			this.getModel('objectView').setProperty(sProperty, sValue);
		},
		/**
		 * Retrieve the neede property value from the View model
		 * @param  {String} sProperty Property who's value has to be retrieved
		 * @return {String} oPropValue Property value
		 * @private
		 */
		_getViewModelProperty: function(sProperty) {
			var oPropValue = this.getModel('objectView')
				.getProperty(sProperty);
			return oPropValue;
		},
		/**
		 * Function for retrieving all the panels in the view.
		 * @return {sap.m.Panel} oPanels array of panels
		 * @private
		 */
		_getAllPanels: function() {
			var oPanels = this._vBox.getItems();
			return oPanels;
		},
		/**
		 * get the details of the draft request
		 * @param  {String} sRequestId Request Id		 
		 * @private
		 */
		_getDraftDetails: function(sRequestId) {
			var oModel = {};
			var mParams = {};

			//Exit if request id is not provided
			if (!sRequestId) {
				jQuery.sap.log.error("Request Id not provided");
				return null;
			}

			oModel = this.getModel();
			mParams = {
				urlParameters: {
					"$expand": ["RequestEmployees/RequestEmployeeEntitlements", "RequestEmployees/RequestEmployeeEntitlements/ItemSizes", 
								"RequestEmployees/Attachments"]
				},
				success: this._readDraftComplete.bind(this)
			};
			// Read the draft request details
			oModel.read("/Requests(RequestId='" + sRequestId + "')", mParams);
		},

		/**
		 * Callback function for handling the completion of draft details
		 * @param  {JSON} oData Draft Request data details
		 * @private
		 */
		_readDraftComplete: function(oData) {
			var oRequest = Utils.mapDraftRequestEmployees(oData);

			var oResourceBundle = this.getResourceBundle(),
				oPage = this.byId("idObjectPage"),
				oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return null;
			}

			this._updateListWithEmployees(oRequest.Employees);

			// Set the values from the Draft request to the JSON Model
			this._oRequestEmpModel.setProperty("/", oRequest);
			this._setViewModelProperties(oRequest);

			oPage.setTitle(oResourceBundle.getText("Request") + " (" + oRequest.RequestId + ")");

			this._oRequestEmpModel.setProperty("/RequestId", oRequest.RequestId);
			//binding to be updated for draft mode.

			// Disable the add employee button in case the maximum number of employees
			// have already been added to draft req.
			if (oRequest.RequestEmployees.length >= oRequest.MaxAllowedEmp) {
				this._updateViewModelProperty("/bAddEmployee", false);
			} else {
				this._updateViewModelProperty("/bAddEmployee", true);
			}

			this._updateViewModelProperty("/busy", false);
		},
		/**
		 * Function to set the properties on View Model
		 * @param  {Object} oRequest Request Payload
		 * @private
		 */
		_setViewModelProperties: function(oRequest) {
			var bPurchaseRequest = true,
				bSpecialRequest = false,
				bThirdPartyRequest = false,
				bApproverVisible = false;
			// Everything went fine.
			//binding to be updated for draft mode.
			this._updateViewModelProperty("/busy", false);
			this._updateViewModelProperty("/bEmployeesSelected", true);

			// By Default Expanded is set to false
			this._updateViewModelProperty("/bAllExpanded", false);

			// Check the Request Type and set value suitably on the view Model
			// All the below checks have to happen and the view model's property for all individual flags have to be set
			// irrespective of the Request Type hence no Switch Case or If statement is used
			bPurchaseRequest = (oRequest.TypeId === Config.constants.PurchaseRequestId) ? true : false;

			this._updateViewModelProperty("/bPurchaseRequest", bPurchaseRequest);

			//Set the Special Request flag on view model
			bSpecialRequest = (oRequest.TypeId === Config.constants.SpecialRequestId) ? true : false;
			this._updateViewModelProperty("/bSpecialRequest", bSpecialRequest);
			//Set the Third Part Request value
			bThirdPartyRequest = (oRequest.TypeId === Config.constants.DamageByThirdPartyTypeId || oRequest.TypeId === Config.constants.LossByThirdPartyTypeId) ?
				true : false;
			this._updateViewModelProperty("/bThirdPartyRequest", bThirdPartyRequest);

			bApproverVisible = (oRequest.TypeId === Config.constants.SpecialRequestId ||
				oRequest.TypeId === Config.constants.DamageByThirdPartyTypeId ||
				oRequest.TypeId === Config.constants.LossByThirdPartyTypeId ||
				oRequest.TypeId === Config.constants.LossOnDutyTypeId ||
				oRequest.TypeId === Config.constants.DamageOnDutyTypeId) ? true : false;

			this._updateViewModelProperty("/bApproverVisible", bApproverVisible);

		},
		/**
		 * Binds the view to the object path.		 
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath) {

			var oController = this;
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					dataRequested: function() {
						this.getOwnerComponent().oWhenMetadataIsLoaded.then(function() {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oController._updateViewModelProperty("/busy", true);
						});
					}.bind(this),
					dataReceived: function(oEvent) {
						if (oEvent.getParameters().data) {
							oController._getDraftDetails.call(oController, oEvent.getParameters().data.RequestId);
						} else {
							oController._updateViewModelProperty("/busy", false);
							jQuery.sap.log.error('No Entitlements received');
						}
					}
				}
			});
		},
		/**
		 * Method to set the state of Expand All / Collapse All Button
		 * @private
		 */
		_updatePanelExpandState: function() {
			var aPanels = this._getAllPanels();
			var iAllPanels = aPanels.length;
			var iExpandedPanelCount = 0;
			var iCollapsedPanelCount = 0;
			// Check the 'Expanded' State of all Panels
			// If all Panels are Expanded manually one after another then at the last panel
			// expansion  , change the state of 'Expand All' Button
			// and vice versae for Collapse Button's state
			for (var i = 0; i < aPanels.length; i++) {
				if (aPanels[i].getExpanded()) {
					iExpandedPanelCount = iExpandedPanelCount + 1;
				} else {
					iCollapsedPanelCount = iCollapsedPanelCount + 1;
				}
			}
			if (iCollapsedPanelCount) {
				this._updateViewModelProperty('/bAllExpanded', false);
			} else {
				this._updateViewModelProperty('/bAllExpanded', true);
			}
		},
		/**
		 * Method to delete the employees from the view.
		 * This also updates the enabled property of Add Employees button
		 * and the Expand Status of button
		 * @param {Object} oContext Selected Employee Context
		 * @private
		 */
		_removeEmployees: function(oContext) {
			var iMaxAllowedEmp = 0;

			var sNameSelectEmployees = oContext._sNameSelectEmployees;
			var aEmployees = oContext.getView().getModel(sNameSelectEmployees).getData().RequestEmployees;
			var iIndex = oContext._getAllPanels().
			map(function(oPanel) {
				return oPanel.getBindingContext(sNameSelectEmployees);
			}).indexOf(oContext);

			//remove error state for this item
			var sPath = this.getPath();
			var errors = Object.keys(Config.InvalidUIMap);

			// Set the dirty flag on UI
			Utils.setUIDirty(true);
			// Set the dirt flag on the model
			oContext._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());

			errors.forEach(function(error) {
				if (error.startsWith(sPath)) {
					delete Config.InvalidUIMap[error];
				}
			});

			//delete the entry from the view and model's data
			aEmployees.splice(sPath.slice(18), 1);
			oContext._oRequestEmpModel.setProperty("/RequestEmployees", aEmployees);

			if (aEmployees.length === 0) {
				// if there are no employees left then update the view for
				// empty page
				oContext._updateViewModelProperty('/bEmployeesSelected', false);
			}

			// Enable the add employee button in case some employees have been deleted and the maximum number of employees
			// is not reached

			if (oContext.getView().getModel(oContext._sNameSelectEmployees).getData().MaxAllowedEmp === undefined) {
				// New Object - Non Draft
				iMaxAllowedEmp = oContext.MaxAllowedEmp;
			} else {
				// Draft Scenario
				iMaxAllowedEmp = oContext.getView().getModel(oContext._sNameSelectEmployees).getData().MaxAllowedEmp;
			}
			if (aEmployees.length < iMaxAllowedEmp) {
				oContext._updateViewModelProperty("/bAddEmployee", true);
			} else {
				oContext._updateViewModelProperty("/bAddEmployee", false);
			}
			// Set the Expanded status to false
			oContext._updateViewModelProperty("/bAllExpanded", false);
		}
	});
});
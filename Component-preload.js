jQuery.sap.registerPreloadedModules({
"name":"Component-preload",
"version":"2.0",
"modules":{
	"sap/cdp/ums/managerequests/Component.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/cdp/ums/managerequests/model/models",
	"sap/cdp/ums/managerequests/controller/ErrorHandler"
], function(UIComponent, Device, models, ErrorHandler) {
	"use strict";

	return UIComponent.extend("sap.cdp.ums.managerequests.Component", {

		metadata: {
			"version": "1.0.0",
			"rootView": "sap.cdp.ums.managerequests.view.App",
			"includes": ["css/style.css"],
			"dependencies": {
				"libs": ["sap.ui.core", "sap.m", "sap.ui.layout"]
			},
			"config": {
				"i18nBundle": "sap.cdp.ums.managerequests.i18n.i18n",
				"serviceUrl": "/sap/opu/odata/sap/ZUMS_MANAGE_REQUESTS",
				"icon": "",
				"favIcon": "",
				"phone": "",
				"phone@2": "",
				"tablet": "",
				"tablet@2": ""
			},
			"routing": {
				"config": {
					"routerClass": "sap.m.routing.Router",
					"viewType": "XML",
					"viewPath": "sap.cdp.ums.managerequests.view",
					"controlId": "app",
					"controlAggregation": "pages",
					"bypassed": {
						"target": "notFound"
					}
				},

				"routes": [{
					"pattern": "",
					"name": "worklist",
					"target": "worklist"
				}, {
					"pattern": "Requests/{objectId}",
					"name": "processobject",
					"target": "processobject"
				}, {

					"pattern": "NewRequest",
					"name": "newobject",
					"target": "object"
				}, {

					"pattern": "Draft/{objectId}",
					"name": "draftobject",
					"target": "object"
				}],

				"targets": {
					"worklist": {
						"viewName": "Worklist",
						"viewId": "worklist",
						"viewLevel": 1
					},
					"processobject": {
						"viewName": "ProcessObject",
						"viewId": "processobject",
						"viewLevel": 2
					},
					"object": {
						"viewName": "Object",
						"viewId": "object",
						"viewLevel": 2
					},
					"objectNotFound": {
						"viewName": "ObjectNotFound",
						"viewId": "objectNotFound"
					},
					"notFound": {
						"viewName": "NotFound",
						"viewId": "notFound"
					}
				}
			}
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this function, the resource and application models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init: function() {
			var mConfig = this.getMetadata().getConfig();

			// create and set the ODataModel
			var oModel = models.createODataModel({
				urlParametersForEveryRequest: [
					"sap-server",
					"sap-client"
					// ,
					// "sap-language"
				],
				url: this.getMetadata().getConfig().serviceUrl,
				config: {
					metadataUrlParams: {
						"sap-documentation": "heading"
					}
				}
			});

			this.setModel(oModel);

			this._createMetadataPromise(oModel);
			// set the i18n model
			this.setModel(models.createResourceModel(mConfig.i18nBundle), "i18n");
			// Set the Constants Model
			this.setModel(models.createConstantsModel(), "constants");
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			// this.setModel(models.createFLPModel(), "FLP");			

			// initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this);

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy: function() {
			this._oErrorHandler.destroy();
			this.getModel().destroy();
			this.getModel("i18n").destroy();
			//this.getModel("FLP").destroy();
			this.getModel("device").destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function() {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},

		/**
		 * Creates a promise which is resolved when the metadata is loaded.
		 * @param {sap.ui.core.Model} oModel the app model
		 * @private
		 */
		_createMetadataPromise: function(oModel) {
			this.oWhenMetadataIsLoaded = new Promise(function(fnResolve, fnReject) {
				oModel.attachEventOnce("metadataLoaded", fnResolve);
				oModel.attachEventOnce("metadataFailed", fnReject);
			});
		}

	});

});
},
	"sap/cdp/ums/managerequests/controller/App.controller.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/cdp/ums/managerequests/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("sap.cdp.ums.managerequests.controller.App", {

		onInit: function() {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().oWhenMetadataIsLoaded.
			then(fnSetAppNotBusy, fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		}
	});

});
},
	"sap/cdp/ums/managerequests/controller/BaseController.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("sap.cdp.ums.managerequests.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function(sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		}
	});

});
},
	"sap/cdp/ums/managerequests/controller/ErrorHandler.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox"
], function(Object, MessageBox) {
	"use strict";

	return Object.extend("sap.cdp.ums.managerequests.controller.ErrorHandler", {

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias sap.cdp.ums.managerequests.controller.ErrorHandler
		 */
		constructor: function(oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorText");
			this._sErrorTitle = this._oResourceBundle.getText("errorTitle");

			this._oModel.attachMetadataFailed(function(oEvent) {
				var oParams = oEvent.getParameters();
				this._updateMessageModel(oComponent);
				this._showMetadataError(oParams.response);
			}, this);

			this._oModel.attachRequestFailed(function(oEvent) {
				var oParams = oEvent.getParameters();
				this._updateMessageModel(oComponent);

				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf(
						"Cannot POST") === 0)) {
					this._showServiceError(oParams.response);
				}
			}, this);
		},

		_updateMessageModel: function(oComponent) {
			var oMessageModel = oComponent.getModel("messages");
			if (oMessageModel) {
				oMessageModel.setProperty('/NoOfMessages', oMessageModel.getData().length);
			}
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
		 * The user can try to refresh the metadata.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showMetadataError: function(sDetails) {
			MessageBox.show(
				this._sErrorText, {
					id: "metadataErrorMessageBox",
					icon: MessageBox.Icon.ERROR,
					title: this._sErrorTitle,
					details: sDetails,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.RETRY, MessageBox.Action.CLOSE],
					onClose: function(sAction) {
						if (sAction === MessageBox.Action.RETRY) {
							this._oModel.refreshMetadata();
						}
					}.bind(this)
				}
			);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function(sDetails) {
			var errorMsg = "",
				innerDetails = "";
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			if (sDetails.message) {
				errorMsg += jQuery.sap.formatMessage(this._oResourceBundle.getText("SERVICE_ERROR_MSG"), sDetails.message);
			}

			if (sDetails.statusCode) {
				errorMsg += jQuery.sap.formatMessage(this._oResourceBundle.getText("SERVICE_ERROR_STATUS_CODE"), sDetails.statusCode);
			}

			if (sDetails.statusText) {
				errorMsg += jQuery.sap.formatMessage(this._oResourceBundle.getText("SERVICE_ERROR_STATUS_TXT"), sDetails.statusText);
			}

			if (sDetails.responseText) {
				var response = JSON.parse(sDetails.responseText);

				if (response.error && response.error.message) {
					errorMsg += jQuery.sap.formatMessage(this._oResourceBundle.getText("SERVICE_ERROR_RESPONSE_MSG"), response.error.message.value);
				}

				if (response.error && response.error.innererror && response.error.innererror.errordetails) {
					var errorDetails = response.error.innererror.errordetails;
					errorMsg += this._oResourceBundle.getText("SERVICE_ERROR_REASON_TXT");
					errorDetails.forEach(function(err) {
						innerDetails += jQuery.sap.formatMessage(this._oResourceBundle.getText("SERVICE_ERROR_REASON_VALUE"), err.message);
					}.bind(this));
				}
			}

			if (innerDetails.length > 0) {
				this._sErrorText = innerDetails;
			}
			MessageBox.show(
				this._sErrorText, {
					id: "serviceErrorMessageBox",
					icon: MessageBox.Icon.ERROR,
					title: this._sErrorTitle,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function() {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		}
	});
});
},
	"sap/cdp/ums/managerequests/controller/NotFound.controller.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/cdp/ums/managerequests/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("sap.cdp.ums.managerequests.controller.NotFound", {

		/**
		 * Navigates to the worklist when the link is pressed
		 * @public
		 */
		onLinkPressed: function() {
			this.getRouter().navTo("worklist");
		}

	});

});
},
	"sap/cdp/ums/managerequests/controller/Object.controller.js":function(){/*
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
},
	"sap/cdp/ums/managerequests/controller/ProcessObject.controller.js":function(){/*
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
},
	"sap/cdp/ums/managerequests/controller/ValueHelpDialog.controller.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/model/Filter",
	"sap/cdp/ums/managerequests/utils/config",
	"sap/cdp/ums/managerequests/utils/utilFunctions",
	"sap/m/MessageBox"
], function(Filter, Config, Utils, MessageBox) {
	"use strict";

	// Search Filter Object
	this._oSearchFilter = {};

	var oValueHelpHandlers = {
		/** 
		 * Event handler for value help ok button
		 * @param {sap.ui.base.Event} oControlEvent The source of the Event
		 * @public
		 */
		onValueHelpOk: function(oControlEvent) {
			// Get the context of selected employees
			var aContexts = oControlEvent.getParameter("selectedContexts");
			var iMaxAllowedEmp = 0;
			var iAddedEmp = 0;
			var bExecuteCallback = true;

			var aSelectedEmployees = [];
			var oViewController = {};

			if (aContexts.length > 0) {
				aSelectedEmployees = aSelectedEmployees.concat(aContexts
					.map(function(oContext) {
						return oContext.getObject();
					}));
			}
			oControlEvent.getSource().getBinding("items").filter([]);

			if (aSelectedEmployees && aSelectedEmployees.length > 0) {

				//Addtional validation to control the number of employees
				// which can be added to any request. 

				// Pick the value of config parameter - Maximum Allowed Employees which backenbd is sending
				// this value will be same for all employees irrestpecive of request type on UI

				iMaxAllowedEmp = aSelectedEmployees[0].MaxAllowedEmp;

				// Extract the information from the controller				
				oViewController = this.oController;

				oViewController.MaxAllowedEmp = iMaxAllowedEmp; // This has been explicitly passed to object controller for furtther processing of 'Delete Employee' button

				// Get the already added employees length (If approvers are present then employees will also ve present beacuse approver
				//	have been calculated in such a way)				
				iAddedEmp = Utils.collectExistingEmpApprovers(oViewController).length + aSelectedEmployees.length;

				if (iAddedEmp > iMaxAllowedEmp) {
					// Raise error and exit
					bExecuteCallback = false;
					MessageBox.show(oViewController.getResourceBundle().getText("maxEmpCountReached", [iMaxAllowedEmp]), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				}

				// Proceed only if above check has been successful
				if (bExecuteCallback) {
					// Check if the 'Approver(s)' are visible and if yes then fire the below validation for five requets types
					if (oViewController.getModel('objectView').getProperty('/bApproverVisible')) {

						bExecuteCallback = this._validateApprovers(aSelectedEmployees, oViewController);
					}
					if (bExecuteCallback) {
						this._executeCallBack(aSelectedEmployees);

					}

					// Set the dirty flag on UI
					Utils.setUIDirty(true);
					// Control the enabled property of 'Cancel' button on UI
					oViewController._updateViewModelProperty("/bUIDirty", Utils.isUIDirty());
				}
			}
			//close of the TableSelect Dialog is taken care by the TableSelectDialog
			//hence no need for closign the dialog
		},

		/**
		 * Event handler for value help Cancel button
		 * @param  {sap.ui.base.Event} oControlEvent The source of the Event
		 * @public
		 */
		onValueHelpCancel: function(oControlEvent) {
			// reset the list of employees
			oControlEvent.getSource().getBinding("items").filter([]);
		},

		/**
		 * Search for the Employee Number/Employee Name in the list of Requests
		 * @param  {sap.ui.base.Event} oEvent The source of the Event
		 * @public
		 */
		onSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("Name", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		/**
		 * Validate for same approver(s) in all the employees
		 * @param  {Array} aSelectedEmployees 
		 * @param  {Object} oViewController 
		 * @private
		 */
		_validateApprovers: function(aSelectedEmployees, oViewController) {

			var aApprovers = [];
			var aExistingApprovers = [];
			var aAllApprovers = [];
			// Array's length and existence check is already done by caller of this function
			// hence no need to repeat the same
			// Get the approvers for newly added employees
			aApprovers = Utils.collectNewEmpApprovers(aSelectedEmployees);
			// Get the approvers for already existing employees
			aExistingApprovers = Utils.collectExistingEmpApprovers(oViewController);
			aAllApprovers = aApprovers.concat(aExistingApprovers);

			if (!Utils.checkSameApprovers(aAllApprovers)) {
				MessageBox.show(oViewController.getResourceBundle().getText("approverMismatch"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
				return false;
			} else {
				return true;
			}

		},
		/**
		 * execute the callback functionif available
		 * @param  {Array} aSelectedEmployees 
		 * @private
		 */
		_executeCallBack: function(aSelectedEmployees) {
			if (!aSelectedEmployees || !this.hasOwnProperty("processSelected")) {
				jQuery.sap.log.error("Either Employees not selected or callback for processing the selected Employees not provided");
				return null;
			}
			this.processSelected(aSelectedEmployees);
			delete this.processSelected;
		},
		/**
		 * Refresh the data binding based on - Chosen employee
		 * @private
		 */
		_refreshBinding: function() {
			var aConsolidatedFilter = [],
				aOverallFilter = [];
			var oValueHelpDialog = {},
				oValueHelpTable = {};

			// Fetch the state of all screen filters
			// Create the Search Filter
			Utils.createSearchFilter.call(this, Config.constants.EmployeeNameSearch);

			// Add the Search Filter
			if (this._oSearchFilter.aFilters) {
				aConsolidatedFilter.push(this._oSearchFilter);
			}

			// Create a single filter with 'AND' condition
			aOverallFilter = [new Filter({
				filters: aConsolidatedFilter,
				bAnd: true
			})];

			oValueHelpDialog = Utils.getFragment(this.sValueHelpFrag);
			//since there is only one table in the value help hence 
			//the array returned from getContent() would have only one value
			oValueHelpTable = oValueHelpDialog.getContent('idValueHelpTable')[0];

			// Rebind the table data applying the filters
			oValueHelpTable.getBinding("items").filter(aOverallFilter, sap.ui.model.FilterType.Application);
		}
	};
	return oValueHelpHandlers;
});
},
	"sap/cdp/ums/managerequests/controller/Worklist.controller.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/cdp/ums/managerequests/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/resource/ResourceModel",
	"sap/m/FacetFilterItem",
	"sap/cdp/ums/managerequests/utils/config",
	"sap/cdp/ums/managerequests/utils/utilFunctions",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, Filter, Sorter,
	ResourceModel, FacetFilterItem, Config, Utils, MessageToast) {
	"use strict";
	return BaseController.extend("sap.cdp.ums.managerequests.controller.Worklist", {
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/** 
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {

			var oViewModel, iOriginalBusyDelay;

			// Store commonly used variables at the global level of view
			this._oTable = this.byId("idTable");
			this._oDateRangeSelection = this.byId("idDateRangeSelection");
			this._oSearch = this.byId("idSearch");
			this._oFacetFilter = this.byId("idFacetFilter");
			this._oStatusFacetFilter = this.byId("idStatusFacetFilterList");
			this._oRequestTypeFacetFilter = this.byId("idRequestFacetFilterList");
			this._oStoreFacetFilter = this.byId("idStoreFacetFilterList");
			this._oDateFromVal = {};
			this._oDateToVal = {};
			this._sSearchVal = "";
			this._aStatusVal = [];
			this._aRequestVal = [];
			this._aStoreVal = [];
			this._oStatusFilter = {};
			this._oRequestTypeFilter = {};
			this._oStoreFilter = {};
			this._oDateFilter = {};
			this._oSearchFilter = {};
			this._sSettingFrag = "Settings";

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.

			iOriginalBusyDelay = this._oTable.getBusyIndicatorDelay();

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				tableBusyDelay: 0,
				dashes: Config.constants.Dashes
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			this._oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
		},
		/**
		 * Called after the worklist view is rendered.
		 * @public
		 */
		onAfterRendering: function() {
			// Call the function to set Default Date
			this._setDefaultDate();
			// Call the function to set Default Status
			this._setDefaultStatus();
			// Do the initial binding passing the date range and the status as filters
			this._loadDefaultData();
			//  Get the Default Status values in variables
			this._loadStatusFilter();
			// No need to get Default Request Type because it will be 'All' 
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent The source of the Event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent The source of the Event
		 * @public
		 */
		onPress: function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler when a 'New Request' is processed
		 * @param {sap.ui.base.Event} oEvent The source of the Event
		 * @public
		 */
		onNew: function(oEvent) {
			// The source is the list item that got pressed
			this._showNewObject();
		},

		/* Handler for message popover button
		 * @param  {sap.ui.base.Event} oControlEvent   The source of the Event
		 * @public
		 */
		onMessagePopPress: function(oControlEvent) {
			Utils.showMessgePopover(oControlEvent.getSource());
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
		 * @public
		 */
		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to FLP home
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#"
					}
				});
			}
		},

		/**
		 * Search for the Employee Number/Employee Name in the list of Requests
		 * @public
		 */
		onSearch: function() {
			// Refresh the data binding based on filters
			this._refreshBinding();
		},
		/**
		 * Filter the Requests based on the Date Range Chosen
		 * @param {sap.ui.base.Event} oEvent The source of the event
		 * @public
		 */
		onDateChange: function(oEvent) {
			// Load the dates
			this._loadDates();

			// Default the date to 1 month's duration if
			// 1. No date is entered			
			if (!this._oDateFromVal || !this._oDateToVal) {
				MessageToast.show(this.getResourceBundle().getText("DateRangeMessage"));
				this._setDefaultDate();
				// Fetch the Default Dates
				this._loadDates();
			}
			// Refresh the data binding based on filters
			this._refreshBinding();
		},

		/**
		 * Attach and open the Sorting dialog box
		 * @param {sap.ui.base.Event} oEvent The source of the event
		 * @public
		 */
		onSettingsClick: function(oEvent) {
			// Instantiate the Settings Dialog
			var oSettingsDialog = Utils.getFragment.call(this, this._sSettingFrag);
			this.getView().addDependent(oSettingsDialog);
			oSettingsDialog.setModel(this.getView().getModel());
			// Open the dialog
			oSettingsDialog.open();
		},
		/**
		 * Perform Sort on the Requests based on the chosen field
		 * @param {sap.ui.base.Event} oEvent The source of the event
		 * @pulic
		 */
		onViewConfirm: function(oEvent) {
			// Get the sort parameter and order
			var mParams = oEvent.getParameters();
			var oBinding = this._oTable.getBinding("items");
			var aSorters = [];
			var sPath = mParams.sortItem.getKey();
			var bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			// apply sorter to binding
			oBinding.sort(aSorters);
		},
		/**
		 * Update the binding based on chosen facet filter values
		 * @public
		 */
		onStatusListClose: function() {
			// Refresh the data binding based on filters
			this._refreshBinding();
		},
		/**
		 * Update the binding based on chosen facet filter values
		 * @public
		 */
		onRequestTypeListClose: function() {
			// Refresh the data binding based on filters
			this._refreshBinding();
		},
		/**
		 * Update the binding based on chosen facet filter values
		 * @public
		 */
		onStoreListClose: function() {
			// Refresh the data binding based on filters
			this._refreshBinding();
		},

		/**
		 * Reset all filters
		 * @param {sap.ui.base.Event} oEvent The source of the event
		 * @pulic
		 */
		onFilterReset: function(oEvent) {

			// Rebind the table data removing the filters
			if (this._aRequestVal.length > 0) {
				this._oRequestTypeFacetFilter.setSelectedKeys();
			}

			if (this._aStatusVal.length > 0) {
				this._oStatusFacetFilter.setSelectedKeys();
			}

			if (this._aStoreVal.length > 0) {
				this._oStoreFacetFilter.setSelectedKeys();
			}

			this._setDefaultDate();
			// Call the function to set Default Status
			this._setDefaultStatus();
			this._refreshBinding();
			// To reflect the updated binding on Facet Filter control
			this._oFacetFilter.rerender();
		},
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function(oItem) {
			var oContext = oItem.getBindingContext();
			var sRequestId = oContext.getProperty("RequestId");
			var sRoutePath = "";
			// Pass the IStyle Reference Number in Case Request Id is not present
			sRequestId = (sRequestId !== "0000000000" && sRequestId !== "" &&
					sRequestId !== null && sRequestId !== undefined) ?
				sRequestId : oContext.getProperty("IstyleReference");

			sRoutePath = (oContext.getProperty('StatusId') === Config.constants.DraftStuatusId) ?
				"draftobject" : "processobject";

			this.getRouter().navTo(sRoutePath, {
				objectId: sRequestId
			});
		},
		/**
		 * Shows the New item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showNewObject: function(oItem) {
			this.getRouter().navTo("newobject");
		},
		/**
		 * Sets the item count on the worklist view header
		 * @param {integer} iTotalItems the total number of items in the table
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
				this.oViewModel.setProperty("/worklistTableTitle", sTitle);
			}
		},
		/**
		 * Set the Default date for 1 month from current date
		 * @private
		 */
		_setDefaultDate: function() {
			// Set the default value of date
			// Get the current date ignoring time as time is not needed
			var oCurrentDate = new Date();
			// Set the second date as the 
			var oOldDateValue = new Date(new Date().setTime(new Date().getTime() -
				parseInt(Config.constants.DurationDays, 10) *
				Config.constants.MillisecondsInDay));

			// Explicitly set the time as zero because time is not needed
			oCurrentDate.setHours(0, 0, 0, 0);

			// Explicitly set the time as zero
			oOldDateValue.setHours(0, 0, 0, 0);
			this.getView().byId("idDateRangeSelection").setDateValue(oOldDateValue);
			this.getView().byId("idDateRangeSelection").setSecondDateValue(oCurrentDate);

		},

		/**
		 * Set the Default Request Status as 'Ready'
		 * @private
		 */
		_setDefaultStatus: function() {
			// Set the default Request state on the Facet Filter
			var oDefaultStatusSel = {};
			oDefaultStatusSel[Config.constants.DefaultStatusTypeValue] =
				Config.constants.DefaultStatusText;
			this.byId("idStatusFacetFilterList").setSelectedKeys(oDefaultStatusSel);
		},
		/**
		 * Load the data initially
		 * @private
		 */
		_loadDefaultData: function() {
			// Create a filter for 'Ready' Status
			var aFilter = [],
				aOverallFilter = [];
			aFilter.push(new Filter(Config.constants.StatusIdColumn, sap.ui.model.FilterOperator.EQ,
				Config.constants.DefaultStatusTypeValue));

			// Since the Request Type won't be dafaulted so don't pass any filter for it 
			// on initial loading

			// Get the selected dates
			this._loadDates();

			// Create a filter for the date range selected
			aFilter.push(new Filter({
				path: Config.constants.CreatedOnSearch,
				operator: sap.ui.model.FilterOperator.BT,
				value1: this._oDateFromVal,
				value2: this._oDateToVal
			}));

			// Create an Overall Filter
			aOverallFilter = [new Filter({
				filters: aFilter,
				bAnd: true
			})];
			//Now refresh the table binding by applying filters.
			this._oTable.getBinding("items").filter(aOverallFilter, sap.ui.model.FilterType.Application);
		},
		/**
		 * Get the date selected
		 * @private
		 */
		_loadDates: function() {
			// Pass the dates in UTC Format
			this._oDateFromVal = Utils.convertToGMTDate(this._oDateRangeSelection.getDateValue());
			this._oDateToVal = Utils.convertToGMTDate(this._oDateRangeSelection.getSecondDateValue());

		},
		/**
		 * Get the value in Search Field
		 * @private
		 */
		_loadSearch: function() {
			// Get the search key
			this._sSearchVal = this._oSearch.getValue().trim();
		},
		/**
		 * Get the selected Status type filter
		 * @private
		 */
		_loadStatusFilter: function() {
			// Get all the selected values 
			this._aStatusVal = this._oStatusFacetFilter.getSelectedItems();
		},
		/**
		 * Get the selected Request type filter
		 * @private
		 */
		_loadRequestFilter: function() {
			// Get all the selected values 
			this._aRequestVal = this._oRequestTypeFacetFilter.getSelectedItems();
		},
		/**
		 * Get the selected Store(Plant) filter
		 * @private
		 */
		_loadStoreFilter: function() {
			// Get all the selected values 
			this._aStoreVal = this._oStoreFacetFilter.getSelectedItems();
		},
		/**
		 * Create the Status Filter from chosen values in Facet Filter
		 * @private
		 */
		_createStatusFilter: function() {

			var aFilter = [];
			// Fetch all the selected filter items
			if (this._aStatusVal.length > 0) {
				for (var i = 0; i < this._aStatusVal.length; i++) {
					aFilter.push(new Filter(Config.constants.StatusIdColumn, sap.ui.model.FilterOperator.EQ,
						this._aStatusVal[i].getKey()));
				}
			} else {
				// If no status filter is selected then by default 'All' is chosen and in that case 
				// we pass an empty filter with contains operator
				aFilter.push(new Filter(Config.constants.StatusIdColumn, sap.ui.model.FilterOperator.Contains,
					""));
			}

			// Create a combined filter with 'AND' condition for all the statuses
			this._oStatusFilter = new Filter({
				filters: aFilter,
				bAnd: false
			});
		},
		/**
		 * Create the Request Type Filter from chosen values in Facet Filter
		 * @private
		 */
		_createRequestTypeFilter: function() {

			var aFilter = [];
			// Fetch all the selected filter items
			if (this._aRequestVal.length > 0) {
				for (var i = 0; i < this._aRequestVal.length; i++) {

					aFilter.push(new Filter(Config.constants.TypeIdColumn, sap.ui.model.FilterOperator.EQ,
						this._aRequestVal[i].getKey()));

				}
			} else {
				// If no Request Type filter is selected then by default 'All' is chosen and in that case 
				// we pass an empty filter with contains operator
				aFilter.push(new Filter(Config.constants.TypeIdColumn, sap.ui.model.FilterOperator.Contains,
					""));
			}

			// Create a combined filter with 'AND' condition for all the statuses
			this._oRequestTypeFilter = new Filter({
				filters: aFilter,
				bAnd: false
			});
		},
		/**
		 * Create the Store(Plant) Filter from chosen values in Facet Filter
		 * @private
		 */
		_createStoreFilter: function() {
			var aFilter = [];
			// Fetch all the selected filter items 
			if (this._aStoreVal.length > 0) {
				for (var i = 0; i < this._aStoreVal.length; i++) {

					aFilter.push(new Filter(Config.constants.StoreIdColumn, sap.ui.model.FilterOperator.EQ,
						this._aStoreVal[i].getKey()));

				}
			} else {
				// If no Store(Plant) filter is selected then by default 'All' is chosen and in that case 
				// we pass an empty filter with contains operator
				aFilter.push(new Filter(Config.constants.StoreIdColumn, sap.ui.model.FilterOperator.Contains,
					""));
			}

			// Create a combined filter with 'AND' condition for all the statuses
			this._oStoreFilter = new Filter({
				filters: aFilter,
				bAnd: false
			});
		},
		/**
		 * Create the Date Filter from chosen values in Date Range
		 * @private
		 */
		_createDateFilter: function() {

			// Create a filter for the date range selected
			this._oDateFilter = new Filter({
				path: Config.constants.CreatedOnSearch,
				operator: sap.ui.model.FilterOperator.BT,
				value1: this._oDateFromVal,
				value2: this._oDateToVal
			});
		},

		/**
		 * Refresh the data binding based on - Facet Filter, Date Range and Search Values
		 * @private
		 */
		_refreshBinding: function() {
			var aConsolidatedFilter = [],
				aOverallFilter = [];
			// Fetch the state of all screen filters
			this._loadStatusFilter();
			this._loadRequestFilter();
			this._loadStoreFilter();
			this._loadDates();
			this._loadSearch();

			// Create a filter for all the selected statuses			
			this._createStatusFilter();

			// Create a filter for all the selcted request types
			this._createRequestTypeFilter();

			// Create a filter for the selected Store(plant)
			this._createStoreFilter();

			// Create the Date Filter
			this._createDateFilter();

			// Create the Search Filter
			Utils.createSearchFilter.call(this, Config.constants.ForSearch);

			// Accumulate all the individual filters
			// Add the Status Filter 
			if (this._oStatusFilter.aFilters) {
				aConsolidatedFilter.push(this._oStatusFilter);
			}

			// Add the Request Type Filter
			if (this._oRequestTypeFilter.aFilters) {
				aConsolidatedFilter.push(this._oRequestTypeFilter);
			}

			// Add the Store(Plant) Filter 
			if (this._oStoreFilter.aFilters) {
				aConsolidatedFilter.push(this._oStoreFilter);
			}

			// Add the Date Filter(It will always be present)
			aConsolidatedFilter.push(this._oDateFilter);

			// Add the Search Filter
			if (this._oSearchFilter.aFilters) {
				aConsolidatedFilter.push(this._oSearchFilter);
			}

			// Create a single filter with 'AND' condition
			aOverallFilter = [new Filter({
				filters: aConsolidatedFilter,
				bAnd: true
			})];
			// Rebind the table data applying the filters
			this._oTable.getBinding("items").filter(aOverallFilter, sap.ui.model.FilterType.Application);
		}
	});

});
},
	"sap/cdp/ums/managerequests/custom/CustomUploadCollection/CustomUpCollectionItem.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define(['jquery.sap.global', 'sap/m/library', 'sap/ui/core/Element', 'sap/m/ObjectAttribute', 'sap/m/ObjectStatus', 'sap/ui/core/util/File'], 
function(q, l, E, O, a, F) {
    'use strict';
    var U = E.extend('sap.cdp.ums.managerequests.custom.CustomUploadCollection.CustomUpCollectionItem', {
        metadata: {
            library: 'sap.m',
            properties: {
                contributor: {
                    type: 'string',
                    group: 'Data',
                    defaultValue: null 
                },
                documentId: {
                    type: 'string',
                    group: 'Misc',
                    defaultValue: null 
                },
                fileName: {
                    type: 'string',
                    group: 'Misc',
                    defaultValue: null 
                },
                fileSize: {
                    type: 'float',
                    group: 'Misc',
                    defaultValue: null 
                },
                mimeType: {
                    type: 'string',
                    group: 'Misc',
                    defaultValue: null 
                },
                thumbnailUrl: {
                    type: 'string',
                    group: 'Misc',
                    defaultValue: null 
                },
                uploadedDate: {
                    type: 'string',
                    group: 'Misc',
                    defaultValue: null 
                },
                url: {
                    type: 'string',
                    group: 'Misc',
                    defaultValue: null 
                },
                enableEdit: {
                    type: 'boolean',
                    group: 'Behavior',
                    defaultValue: true
                },
                enableDelete: {
                    type: 'boolean',
                    group: 'Behavior',
                    defaultValue: true
                },
                visibleEdit: {
                    type: 'boolean',
                    group: 'Behavior',
                    defaultValue: true
                },
                visibleDelete: {
                    type: 'boolean',
                    group: 'Behavior',
                    defaultValue: true
                },
                ariaLabelForPicture: {
                    type: 'string',
                    group: 'Accessibility',
                    defaultValue: null 
                },
                selected: {
                    type: 'boolean',
                    group: 'Behavior',
                    defaultValue: false
                }
            },
            defaultAggregation: 'attributes',
            aggregations: {
                attributes: {
                    type: 'sap.m.ObjectAttribute',
                    multiple: true
                },
                _propertyAttributes: {
                    type: 'sap.m.ObjectAttribute',
                    multiple: true,
                    visibility: 'hidden'
                },
                statuses: {
                    type: 'sap.m.ObjectStatus',
                    multiple: true
                }
            },
            associations: {
                fileUploader: {
                    type: 'sap.ui.unified.FileUploader',
                    group: 'misc',
                    multiple: false
                }
            }
        }
    });
    U.prototype.init = function() {
        this._mDeprecatedProperties = {};
    }
    ;
    U.prototype.setContributor = function(c) {
        this.setProperty('contributor', c, false);
        this._updateDeprecatedProperties();
        return this;
    }
    ;
    U.prototype.setUploadedDate = function(u) {
        this.setProperty('uploadedDate', u, false);
        this._updateDeprecatedProperties();
        return this;
    }
    ;
    U.prototype.setFileSize = function(f) {
        this.setProperty('fileSize', f, false);
        this._updateDeprecatedProperties();
        return this;
    }
    ;
    U.prototype.setSelected = function(s) {
        if (s !== this.getSelected()) {
            this.setProperty('selected', s, true);
            this.fireEvent('selected');
        }
    }
    ;
    U.prototype.download = function(b) {
        if (sap.ui.Device.browser.name === 'sf') {
            b = false;
        }
        if (!this.getUrl()) {
            q.sap.log.warning('Items to download do not have an URL.');
            return false;
        } else if (b) {
            var B = null ;
            var x = new window.XMLHttpRequest();
            x.open('GET', this.getUrl());
            x.responseType = 'blob';
            x.onload = function() {
                var f = this.getFileName();
                var o = this._splitFileName(f, false);
                var s = o.extension;
                f = o.name;
                B = x.response;
                F.save(B, f, s, this.getMimeType(), 'utf-8');
            }
            .bind(this);
            x.send();
            return true;
        } else {
            l.URLHelper.redirect(this.getUrl(), true);
            return true;
        }
    }
    ;
    U.prototype._splitFileName = function(f, w) {
        var r = {};
        var R = /(?:\.([^.]+))?$/;
        var b = R.exec(f);
        r.name = f.slice(0, f.indexOf(b[0]));
        if (w) {
            r.extension = b[0];
        } else {
            r.extension = b[1];
        }
        return r;
    }
    ;
    U.prototype._updateDeprecatedProperties = function() {
        var p = ['uploadedDate', 'contributor', 'fileSize'];
        this.removeAllAggregation('_propertyAttributes', true);
        q.each(p, function(i, n) {
            var v = this.getProperty(n)
              , A = this._mDeprecatedProperties[n];
            if (q.type(v) === 'number' && !!v || !!v) {
                if (!A) {
                    A = new O({
                        active: false
                    });
                    this._mDeprecatedProperties[n] = A;
                    this.addAggregation('_propertyAttributes', A, true);
                    A.setText(v);
                } else {
                    A.setText(v);
                    this.addAggregation('_propertyAttributes', A, true);
                }
            } else if (A) {
                A.destroy();
                delete this._mDeprecatedProperties[n];
            }
        }
        .bind(this));
        this.invalidate();
    }
    ;
    U.prototype.getAllAttributes = function() {
        return this.getAggregation('_propertyAttributes', []).concat(this.getAttributes());
    }
    ;
    return U;
}, true);
},
	"sap/cdp/ums/managerequests/custom/CustomUploadCollection/CustomUploadCollection.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define(['jquery.sap.global', 'sap/m/MessageBox', 'sap/m/Dialog', 'sap/m/library',
		'sap/m/UploadCollection', 'sap/ui/unified/FileUploaderParameter',
		'sap/ui/unified/FileUploader', 'sap/ui/core/format/FileSizeFormat', 'sap/m/Link',
		'sap/m/OverflowToolbar', 'sap/m/ObjectAttribute', 'sap/m/ObjectStatus',
		'sap/cdp/ums/managerequests/custom/CustomUploadCollection/CustomUpCollectionItem', 'sap/ui/core/HTML', 'sap/m/BusyIndicator',
		'sap/m/CustomListItem', 'sap/m/CustomListItemRenderer', 'sap/ui/core/HTMLRenderer',
		'sap/m/LinkRenderer', 'sap/m/ObjectAttributeRenderer', 'sap/m/ObjectStatusRenderer',
		'sap/m/TextRenderer', 'sap/m/DialogRenderer'
	],
	function(q, M, D, L, C, F, a, b, c, O, d, f, CustUploadCollectionItem, H, B, g) {
		'use strict';
		var h = C.extend('sap.cdp.ums.managerequests.custom.CustomUploadCollection.CustomUploadCollection', {

			constructor: function(i, s) {
			 //   forcing instant upload to be false
				var I = false;
				if (s && s.instantUpload === false) {
					I = s.instantUpload;
					delete s.instantUpload;
				} else if (i && i.instantUpload === false) {
					I = i.instantUpload;
					delete i.instantUpload;
				}
				if (s && s.mode === sap.m.ListMode.MultiSelect && I === false) {
					s.mode = sap.m.ListMode.None;
					q.sap.log.info(
						"sap.m.ListMode.MultiSelect is not supported by UploadCollection for Upload Pending scenario. Value has been resetted to 'None'"
					);
				} else if (i && i.mode === sap.m.ListMode.MultiSelect && I === false) {
					i.mode = sap.m.ListMode.None;
					q.sap.log.info(
						"sap.m.ListMode.MultiSelect is not supported by UploadCollection for Upload Pending scenario. Value has been resetted to 'None'"
					);
				}
				try {
					C.apply(this, arguments);
					if (I === false) {
						this.bInstantUpload = I;
						this._oFormatDecimal = b.getInstance({
							binaryFilesize: false,
							maxFractionDigits: 1,
							maxIntegerDigits: 3
						});
					}
				} catch (e) {
					this.destroy();
					throw e;
				}
			},
			metadata: {
				library: 'sap.m',
				properties: {
					fileType: {
						type: 'string[]',
						group: 'Data',
						defaultValue: null
					},
					maximumFilenameLength: {
						type: 'int',
						group: 'Data',
						defaultValue: null
					},
					maximumFileSize: {
						type: 'float',
						group: 'Data',
						defaultValue: null
					},
					mimeType: {
						type: 'string[]',
						group: 'Data',
						defaultValue: null
					},
					multiple: {
						type: 'boolean',
						group: 'Behavior',
						defaultValue: false
					},
					noDataText: {
						type: 'string',
						group: 'Behavior',
						defaultValue: null
					},
					sameFilenameAllowed: {
						type: 'boolean',
						group: 'Behavior',
						defaultValue: false
					},
					showSeparators: {
						type: 'sap.m.ListSeparators',
						group: 'Appearance',
						defaultValue: sap.m.ListSeparators.All
					},
					uploadEnabled: {
						type: 'boolean',
						group: 'Behavior',
						defaultValue: true
					},
					uploadUrl: {
						type: 'string',
						group: 'Data',
						defaultValue: '/sap/opu/odata/sap/ZUMS_MANAGE_REQUESTS/Attachments'
					},
					instantUpload: {
						type: 'boolean',
						group: 'Behavior',
						defaultValue: false
					},
					numberOfAttachmentsText: {
						type: 'string',
						group: 'Appearance',
						defaultValue: null
					},
					mode: {
						type: 'sap.m.ListMode',
						group: 'Behavior',
						defaultValue: 'Delete'
					}
				},
				defaultAggregation: 'items',
				aggregations: {
					items: {
						type: 'sap.cdp.ums.managerequests.custom.CustomUploadCollection.CustomUpCollectionItem',
						multiple: true,
						singularName: 'item'
					},
					headerParameters: {
						type: 'sap.m.UploadCollectionParameter',
						multiple: true,
						singularName: 'headerParameter'
					},
					parameters: {
						type: 'sap.m.UploadCollectionParameter',
						multiple: true,
						singularName: 'parameter'
					},
					toolbar: {
						type: 'sap.m.OverflowToolbar',
						multiple: false
					},
					_list: {
						type: 'sap.m.List',
						multiple: false,
						visibility: 'hidden'
					}
				},
				events: {
					change: {
						parameters: {
							documentId: {
								type: 'string'
							},
							files: {
								type: 'object[]'
							}
						}
					},
					fileDeleted: {
						parameters: {
							documentId: {
								type: 'string'
							},
							item: {
								type: 'sap.cdp.ums.managerequests.custom.CustomUploadCollection.CustomUpCollectionItem'
							}
						}
					},
					filenameLengthExceed: {
						parameters: {
							documentId: {
								type: 'string'
							},
							files: {
								type: 'object[]'
							}
						}
					},
					fileRenamed: {
						parameters: {
							documentId: {
								type: 'string'
							},
							fileName: {
								type: 'string'
							},
							item: {
								type: 'sap.cdp.ums.managerequests.custom.CustomUploadCollection.CustomUpCollectionItem'
							}
						}
					},
					fileSizeExceed: {
						parameters: {
							documentId: {
								type: 'string'
							},
							fileSize: {
								type: 'string'
							},
							files: {
								type: 'object[]'
							}
						}
					},
					typeMissmatch: {
						parameters: {
							documentId: {
								type: 'string'
							},
							fileType: {
								type: 'string'
							},
							mimeType: {
								type: 'string'
							},
							files: {
								type: 'object[]'
							}
						}
					},
					uploadComplete: {
						parameters: {
							readyStateXHR: {
								type: 'string'
							},
							response: {
								type: 'string'
							},
							status: {
								type: 'string'
							},
							files: {
								type: 'object[]'
							}
						}
					},
					uploadTerminated: {
						parameters: {
							fileName: {
								type: 'string'
							},
							getHeaderParameter: {
								type: 'function',
								parameters: {
									headerParameterName: {
										type: 'string'
									}
								}
							}
						}
					},
					beforeUploadStarts: {
						parameters: {
							fileName: {
								type: 'string'
							},
							addHeaderParameter: {
								type: 'function',
								parameters: {
									headerParameter: {
										type: 'sap.m.UploadCollectionParameter'
									}
								}
							},
							getHeaderParameter: {
								type: 'function',
								parameters: {
									headerParameterName: {
										type: 'string'
									}
								}
							}
						}
					},
					selectionChange: {
						parameters: {
							selectedItem: {
								type: 'sap.cdp.ums.managerequests.custom.CustomUploadCollection.CustomUpCollectionItem'
							},
							selectedItems: {
								type: 'sap.cdp.ums.managerequests.custom.CustomUploadCollection.CustomUpCollectionItem[]'
							},
							selected: {
								type: 'boolean'
							}
						}
					}
				}
			},
			renderer: function(r, control) {
				r.write('<div');
				r.writeControlData(control);
				r.addClass('sapMUC');
				r.writeClasses();
				r.write('>');
				r.renderControl(control._oList);
				r.write('</div>');
			}
		});
		h._uploadingStatus = 'uploading';
		h._displayStatus = 'display';
		h._toBeDeletedStatus = 'toBeDeleted';
		h._pendingUploadStatus = 'pendingUploadStatus';
		h._placeholderCamera = 'sap-icon://camera';
		h.prototype.init = function() {
			h.prototype._oRb = sap.ui.getCore().getLibraryResourceBundle('sap.m');
			this._headerParamConst = {
				requestIdName: 'requestId' + q.now(),
				fileNameRequestIdName: 'fileNameRequestId' + q.now()
			};
			this._requestIdValue = 0;
			this._iFUCounter = 0;
			this._oList = new sap.m.List(this.getId() + '-list');
			this.setAggregation('_list', this._oList, true);
			this._oList.addStyleClass('sapMUCList');
			this._cAddItems = 0;
			this._iUploadStartCallCounter = 0;
			this.aItems = [];
			this._aDeletedItemForPendingUpload = [];
			this._aFileUploadersForPendingUpload = [];
			this._iFileUploaderPH = null;
			this._oListEventDelegate = null;
			this._oItemToUpdate = null;
		};
		h.prototype.setFileType = function(e) {
			if (!e) {
				return this;
			}
			if (!this.getInstantUpload()) {
				q.sap.log.info('As property instantUpload is false it is not allowed to change fileType at runtime.');
			} else {
				var j = e.length;
				for (var i = 0; i < j; i++) {
					e[i] = e[i].toLowerCase();
				}
				this.setProperty('fileType', e);
				if (this._getFileUploader().getFileType() !== e) {
					this._getFileUploader().setFileType(e);
				}
			}
			return this;
		};
		h.prototype.setMaximumFilenameLength = function(m) {
			if (!this.getInstantUpload()) {
				q.sap.log.info('As property instantUpload is false it is not allowed to change maximumFilenameLength at runtime.');
			} else {
				this.setProperty('maximumFilenameLength', m, true);
				if (this._getFileUploader().getMaximumFilenameLength() !== m) {
					this._getFileUploader().setMaximumFilenameLength(m);
				}
			}
			return this;
		};
		h.prototype.setMaximumFileSize = function(m) {
			if (!this.getInstantUpload()) {
				q.sap.log.info('As property instantUpload is false it is not allowed to change maximumFileSize at runtime.');
			} else {
				this.setProperty('maximumFileSize', m, true);
				if (this._getFileUploader().getMaximumFileSize() !== m) {
					this._getFileUploader().setMaximumFileSize(m);
				}
			}
			return this;
		};
		h.prototype.setMimeType = function(m) {
			if (!this.getInstantUpload()) {
				q.sap.log.info('As property instantUpload is false it is not allowed to change mimeType at runtime.');
			} else {
				this.setProperty('mimeType', m);
				if (this._getFileUploader().getMimeType() !== m) {
					this._getFileUploader().setMimeType(m);
				}
				return this;
			}
		};
		h.prototype.setMultiple = function(m) {
			if (!this.getInstantUpload()) {
				q.sap.log.info('As property instantUpload is false it is not allowed to change multiple at runtime.');
			} else {
				this.setProperty('multiple', m);
				if (this._getFileUploader().getMultiple() !== m) {
					this._getFileUploader().setMultiple(m);
				}
				return this;
			}
		};
		h.prototype.setNoDataText = function(n) {
			this.setProperty('noDataText', n);
			if (this._oList.getNoDataText() !== n) {
				this._oList.setNoDataText(n);
			}
			return this;
		};
		h.prototype.setShowSeparators = function(s) {
			this.setProperty('showSeparators', s);
			if (this._oList.getShowSeparators() !== s) {
				this._oList.setShowSeparators(s);
			}
			return this;
		};
		h.prototype.setUploadEnabled = function(u) {
			if (!this.getInstantUpload()) {
				q.sap.log.info('As property instantUpload is false it is not allowed to change uploadEnabled at runtime.');
			} else {
				this.setProperty('uploadEnabled', u);
				if (this._getFileUploader().getEnabled() !== u) {
					this._getFileUploader().setEnabled(u);
				}
			}
			return this;
		};
		h.prototype.setUploadUrl = function(u) {
			if (!this.getInstantUpload()) {
				q.sap.log.info('As property instantUpload is false it is not allowed to change uploadUrl at runtime.');
			} else {
				this.setProperty('uploadUrl', u);
				if (this._getFileUploader().getUploadUrl() !== u) {
					this._getFileUploader().setUploadUrl(u);
				}
			}
			return this;
		};
		h.prototype.setInstantUpload = function() {
			q.sap.log.error('It is not supported to change the behavior at runtime.');
			return this;
		};
		h.prototype.setMode = function(m) {
			if (m === sap.m.ListMode.Delete) {
				this._oList.setMode(sap.m.ListMode.None);
				q.sap.log.info("sap.m.ListMode.Delete is not supported by UploadCollection. Value has been resetted to 'None'");
			} else if (m === sap.m.ListMode.MultiSelect && !this.getInstantUpload()) {
				this._oList.setMode(sap.m.ListMode.None);
				q.sap.log.info(
					"sap.m.ListMode.MultiSelect is not supported by UploadCollection for Pending Upload. Value has been resetted to 'None'");
			} else {
				this._oList.setMode(m);
			}
		};
		h.prototype.getMode = function() {
			return this._oList.getMode();
		};
		h.prototype.getToolbar = function() {
			return this._oHeaderToolbar;
		};
		h.prototype.upload = function() {
			if (this.getInstantUpload()) {
				q.sap.log.error("Not a valid API call. 'instantUpload' should be set to 'false'.");
			}
			
			//custom - start
			var uploadPromises = [];

			var reqInfo = this._aFileUploadersForPendingUpload[0].getHeaderParameters()[3];
			var	paramName = reqInfo.getProperty('name'); 
			var	paramValue = reqInfo.getProperty('value');
			var filesDelete = [];

			this._aDeletedItemForPendingUpload.map(function (file) {
				filesDelete.push(file.getProperty("fileName"));
			});

			return this._aFileUploadersForPendingUpload.map(function (uploader) {
				var index = filesDelete.indexOf(uploader.oFilePath.getValue());
				if (index >= 0) {
					filesDelete.pop();
				}
				else {
					var uploaded = jQuery.Deferred(),
						recInfo = uploader.getHeaderParameters()[3];

					if (!recInfo) {
						uploader.addHeaderParameter(
							new sap.ui.unified.FileUploaderParameter({
								name: paramName,
								value: paramValue
							}));
					}

					//file upload call successful
					uploader.attachUploadComplete(function () {
						//errored call also comes to complete event, so handle error cases
						if(arguments[0].getParameter('status') === 201) {
							uploaded.resolve();
						}
						else {
							uploaded.reject();					
						}					
					});

					//file upload call failed
					uploader.attachUploadAborted(function () {
						uploaded.reject();					
					});

					uploader.upload();

					return uploaded.promise();
				}
			});
			//custom - end
		};
		h.prototype.getSelectedItems = function() {
			var s = this._oList.getSelectedItems();
			return this._getUploadCollectionItemsByListItems(s);
		};
		h.prototype.getSelectedItem = function() {
			var s = this._oList.getSelectedItem();
			if (s) {
				return this._getUploadCollectionItemByListItem(s);
			}
		};
		h.prototype.setSelectedItemById = function(i, s) {
			this._oList.setSelectedItemById(i + '-cli', s);
			this._setSelectedForItems([this._getUploadCollectionItemById(i)], s);
			return this;
		};
		h.prototype.setSelectedItem = function(u, s) {
			this.setSelectedItemById(u.getId(), s);
			return this;
		};
		h.prototype.selectAll = function() {
			var s = this._oList.selectAll();
			if (s.getItems().length !== this.getItems().length) {
				q.sap.log.info("Internal 'List' and external 'UploadCollection' are not in sync.");
			}
			this._setSelectedForItems(this.getItems(), true);
			return this;
		};
		h.prototype.downloadItem = function(u, e) {
			if (!this.getInstantUpload()) {
				q.sap.log.info('Download is not possible on Pending Upload mode');
				return false;
			} else {
				return u.download(e);
			}
		};
		h.prototype.openFileDialog = function(i) {
			if (this._oFileUploader) {
				if (i) {
					if (!this._oFileUploader.getMultiple()) {
						this._oItemToUpdate = i;
						this._oFileUploader.$().find('input[type=file]').trigger('click');
					} else {
						q.sap.log.warning('Version Upload cannot be used in multiple upload mode');
					}
				} else {
					this._oFileUploader.$().find('input[type=file]').trigger('click');
				}
			}
			return this;
		};
		h.prototype.removeAggregation = function(A, o, s) {
			if (!this.getInstantUpload() && A === 'items' && o) {
				this._aDeletedItemForPendingUpload.push(o);
			}
			if (C.prototype.removeAggregation) {
				return C.prototype.removeAggregation.apply(this, arguments);
			}
		};
		h.prototype.removeAllAggregation = function(A, s) {
			if (!this.getInstantUpload() && A === 'items') {
				if (this._aFileUploadersForPendingUpload) {
					for (var i = 0; i < this._aFileUploadersForPendingUpload.length; i++) {
						this._aFileUploadersForPendingUpload[i].destroy();
						this._aFileUploadersForPendingUpload[i] = null;
					}
					this._aFileUploadersForPendingUpload = [];
				}
			}
			if (C.prototype.removeAllAggregation) {
				return C.prototype.removeAllAggregation.apply(this, arguments);
			}
		};
		h.prototype.onBeforeRendering = function() {
			this._RenderManager = this._RenderManager || sap.ui.getCore().createRenderManager();
			var i, e;
			if (this._oListEventDelegate) {
				this._oList.removeEventDelegate(this._oListEventDelegate);
				this._oListEventDelegate = null;
			}
			j.bind(this)();
			if (!this.getInstantUpload()) {
				this.aItems = this.getItems();
				this._getListHeader(this.aItems.length);
				this._clearList();
				this._fillList(this.aItems);
				this._oList.setHeaderToolbar(this._oHeaderToolbar);
				return;
			}
			if (this.aItems.length > 0) {
				e = this.aItems.length;
				var u = [];
				for (i = 0; i < e; i++) {
					if (this.aItems[i] && this.aItems[i]._status === h._uploadingStatus && this.aItems[i]._percentUploaded !== 100) {
						u.push(this.aItems[i]);
					} else if (this.aItems[i] && this.aItems[i]._status !== h._uploadingStatus && this.aItems[i]._percentUploaded === 100 && this.getItems()
						.length === 0) {
						u.push(this.aItems[i]);
					}
				}
				if (u.length === 0) {
					this.aItems = [];
					this.aItems = this.getItems();
				}
			} else {
				this.aItems = this.getItems();
			}
			this._getListHeader(this.aItems.length);
			this._clearList();
			this._fillList(this.aItems);
			this._oList.setAggregation('headerToolbar', this._oHeaderToolbar, true);
			if ((sap.ui.Device.browser.msie && sap.ui.Device.browser.version <= 9) && this.aItems.length > 0 && this.aItems[0]._status === h._uploadingStatus) {
				this._oFileUploader.setEnabled(false);
			} else {
				if (this.sErrorState !== 'Error') {
					if (this.getUploadEnabled() !== this._oFileUploader.getEnabled()) {
						this._oFileUploader.setEnabled(this.getUploadEnabled());
					}
				} else {
					this._oFileUploader.setEnabled(false);
				}
			}
			if (this.sDeletedItemId) {
				q(document.activeElement).blur();
			}

			function j() {
				if (this.bInstantUpload === false) {
					this.setProperty('instantUpload', this.bInstantUpload, true);
					delete this.bInstantUpload;
				}
			}
		};
		h.prototype.onAfterRendering = function() {
			var t = this;
			if (this.getInstantUpload()) {
				if (this.aItems || (this.aItems === this.getItems())) {
					if (this.editModeItem) {
						var $ = q.sap.byId(this.editModeItem + '-ta_editFileName-inner');
						if ($) {
							var i = this.editModeItem;
							if (!sap.ui.Device.os.ios) {
								$.focus(function() {
									$.selectText(0, $.val().length);
								});
							}
							$.focus();
							this._oListEventDelegate = {
								onclick: function(e) {
									sap.m.CustomUploadCollection.prototype._handleClick(e, t, i);
								}
							};
							this._oList.addDelegate(this._oListEventDelegate);
						}
					} else if (this.sFocusId) {
						sap.m.CustomUploadCollection.prototype._setFocus2LineItem(this.sFocusId);
						this.sFocusId = null;
					} else if (this.sDeletedItemId) {
						sap.m.CustomUploadCollection.prototype._setFocusAfterDeletion(this.sDeletedItemId, t);
					}
				}
			} else {
				if (this.sFocusId) {
					sap.m.UploadCollection.prototype._setFocus2LineItem(this.sFocusId);
					this.sFocusId = null;
				}
			}
		};
		h.prototype.exit = function() {
			var i, p;
			if (this._oFileUploader) {
				this._oFileUploader.destroy();
				this._oFileUploader = null;
			}
			if (this._oHeaderToolbar) {
				this._oHeaderToolbar.destroy();
				this._oHeaderToolbar = null;
			}
			if (this._oNumberOfAttachmentsTitle) {
				this._oNumberOfAttachmentsTitle.destroy();
				this._oNumberOfAttachmentsTitle = null;
			}
			if (this._RenderManager) {
				this._RenderManager.destroy();
			}
			if (this._aFileUploadersForPendingUpload) {
				p = this._aFileUploadersForPendingUpload.length;
				for (i = 0; i < p; i++) {
					this._aFileUploadersForPendingUpload[i].destroy();
					this._aFileUploadersForPendingUpload[i] = null;
				}
				this._aFileUploadersForPendingUpload = null;
			}
		};
		h.prototype._hideFileUploaders = function() {
			var t, i;
			if (!this.getInstantUpload()) {
				t = this._oHeaderToolbar.getContent().length;
				if (this._aFileUploadersForPendingUpload.length) {
					for (i = 0; i < t; i++) {
						if (this._oHeaderToolbar.getContent()[i] instanceof sap.ui.unified.FileUploader && i !== this._iFileUploaderPH) {
							this._oHeaderToolbar.getContent()[i].$().hide();
						}
					}
				}
				return;
			}
		};
		h.prototype._getListHeader = function(I) {
			var o, i;
			this._setNumberOfAttachmentsTitle(I);
			if (!this._oHeaderToolbar) {
				if (!!this._oFileUploader && !this.getInstantUpload()) {
					this._oFileUploader.destroy();
				}
				o = this._getFileUploader();
				this._oHeaderToolbar = this.getAggregation('toolbar');
				if (!this._oHeaderToolbar) {
					this._oHeaderToolbar = new sap.m.OverflowToolbar(this.getId() + '-toolbar', {
						content: [this._oNumberOfAttachmentsTitle, new sap.m.ToolbarSpacer(), o]
					}).addEventDelegate({
						onAfterRendering: this._hideFileUploaders
					}, this);
					this._iFileUploaderPH = 2;
				} else {
					this._oHeaderToolbar.addEventDelegate({
						onAfterRendering: this._hideFileUploaders
					}, this);
					this._iFileUploaderPH = this._getFileUploaderPlaceHolderPosition(this._oHeaderToolbar);
					if (this._oHeaderToolbar && this._iFileUploaderPH > -1) {
						this._setFileUploaderInToolbar(o);
					} else {
						q.sap.log.info("A place holder of type 'sap.m.UploadCollectionPlaceholder' needs to be provided.");
					}
				}
			} else if (!this.getInstantUpload()) {
				var p = this._aFileUploadersForPendingUpload.length;
				for (i = p - 1; i >= 0; i--) {
					if (this._aFileUploadersForPendingUpload[i].getId() == this._oFileUploader.getId()) {
						o = this._getFileUploader();
						this._oHeaderToolbar.insertAggregation('content', o, this._iFileUploaderPH, true);
						break;
					}
				}
			}
		};
		h.prototype._getFileUploaderPlaceHolderPosition = function(t) {
			for (var i = 0; i < t.getContent().length; i++) {
				if (t.getContent()[i] instanceof sap.m.UploadCollectionToolbarPlaceholder) {
					return i;
				}
			}
			return -1;
		};
		h.prototype._setFileUploaderInToolbar = function(o) {
			this._oHeaderToolbar.getContent()[this._iFileUploaderPH].setVisible(false);
			this._oHeaderToolbar.insertContent(o, this._iFileUploaderPH);
		};
		h.prototype._mapItemToListItem = function(i) {
			if (!i || (this._oItemToUpdate && i.getId() === this._oItemToUpdate.getId())) {
				return null;
			}
			var I, s, e, o, l, j, $, k, m, t = this;
			I = i.getId();
			s = i._status;
			e = i.getFileName();
			if (s === h._uploadingStatus) {
				o = new sap.m.BusyIndicator(I + '-ia_indicator', {
					visible: true
				}).addStyleClass('sapMUCloadingIcon');
			} else {
				m = this._createIcon(i, I, e, t);
			}
			j = I + '-container';
			$ = q.sap.byId(j);
			if (!!$) {
				$.remove();
				$ = null;
			}
			k = new sap.ui.core.HTML({
				content: '<span id=' + j + ' class= sapMUCTextButtonContainer> </span>',
				afterRendering: function() {
					t._renderContent(i, j, t);
				}
			});
			l = new sap.m.CustomListItem(I + '-cli', {
				content: [o, m, k],
				selected: i.getSelected()
			});
			l._status = s;
			l.addStyleClass('sapMUCItem');
			return l;
		};
		h.prototype._renderContent = function(I, s, t) {
			var e, i, A, S, p, j, k, r, l;
			p = I._percentUploaded;
			j = I.getAllAttributes();
			k = I.getStatuses();
			e = I.getId();
			A = j.length;
			S = k.length;
			l = I._status;
			r = t._RenderManager;
			r.write('<div class="sapMUCTextContainer ');
			if (l === 'Edit') {
				r.write('sapMUCEditMode ');
			}
			r.write('" >');
			r.renderControl(this._getFileNameControl(I, t));
			if (l === h._uploadingStatus && !(sap.ui.Device.browser.msie && sap.ui.Device.browser.version <= 9)) {
				r.renderControl(this._createProgressLabel(e, p));
			} else {
				if (A > 0) {
					r.write('<div class="sapMUCAttrContainer">');
					for (i = 0; i < A; i++) {
						j[i].addStyleClass('sapMUCAttr');
						r.renderControl(j[i]);
						if ((i + 1) < A) {
							//commented since we get eslint error on hardcoding color
							//r.write('<div class="sapMUCSeparator"> &#x00B7&#160</div>');
						}
					}
					r.write('</div>');
				}
				if (S > 0) {
					r.write('<div class="sapMUCStatusContainer">');
					for (i = 0; i < S; i++) {
						k[i].detachBrowserEvent('hover');
						r.renderControl(k[i]);
						if ((i + 1) < S) {
							//commented since we get eslint error on hardcoding color
							//r.write('<div class="sapMUCSeparator"> &#x00B7&#160</div>');
						}
					}
					r.write('</div>');
				}
			}
			r.write('</div>');
			this._renderButtons(r, I, l, e, t);
			r.flush(q.sap.byId(s)[0], true);
		};
		h.prototype._renderButtons = function(r, I, s, e, t) {
			var j, k;
			j = this._getButtons(I, s, e, t);
			if (!!j) {
				k = j.length;
			}
			if (k > 0) {
				r.write('<div class="sapMUCButtonContainer">');
				for (var i = 0; i < k; i++) {
					if ((i + 1) < k) {
						j[i].addStyleClass('sapMUCFirstButton');
					}
					r.renderControl(j[i]);
				}
				r.write('</div>');
			}
		};
		h.prototype._getFileNameControl = function(i, t) {
			var e, o, j, s, k, I, S, m, v, l, n, V;
			k = i.getFileName();
			I = i.getId();
			S = i._status;
			if (S !== 'Edit') {
				e = true;
				if (this.sErrorState === 'Error' || !q.trim(i.getUrl())) {
					e = false;
				}
				o = sap.ui.getCore().byId(I + '-ta_filenameHL');
				if (!o) {
					o = new sap.m.Link(I + '-ta_filenameHL', {
						enabled: e,
						press: function(E) {
								this._triggerLink(E, t);
							}
							.bind(this)
					}).addStyleClass('sapMUCFileName');
					o.setModel(i.getModel());
					o.setText(k);
				} else {
					o.setModel(i.getModel());
					o.setText(k);
					o.setEnabled(e);
				}
				return o;
			} else {
				j = t._splitFilename(k);
				m = t.getMaximumFilenameLength();
				v = 'None';
				l = false;
				s = j.name;
				if (i.errorState === 'Error') {
					l = true;
					v = 'Error';
					s = i.changedFileName;
					if (s.length === 0) {
						V = this._oRb.getText('UPLOADCOLLECTION_TYPE_FILENAME');
					} else {
						V = this._oRb.getText('UPLOADCOLLECTION_EXISTS');
					}
				}
				n = sap.ui.getCore().byId(I + '-ta_editFileName');
				if (!n) {
					n = new sap.m.Input(I + '-ta_editFileName', {
						type: sap.m.InputType.Text,
						fieldWidth: '75%',
						valueState: v,
						valueStateText: V,
						showValueStateMessage: l,
						description: j.extension
					}).addStyleClass('sapMUCEditBox');
					n.setModel(i.getModel());
					n.setValue(s);
				} else {
					n.setModel(i.getModel());
					n.setValueState(v);
					n.setFieldWidth('75%');
					n.setValueStateText(V);
					n.setValue(s);
					n.setDescription(j.extension);
					n.setShowValueStateMessage(l);
				}
				if ((m - j.extension.length) > 0) {
					n.setProperty('maxLength', m - j.extension.length, true);
				}
				return n;
			}
		};
		h.prototype._createProgressLabel = function(i, p) {
			var P;
			P = sap.ui.getCore().byId(i + '-ta_progress');
			if (!P) {
				P = new sap.m.Label(i + '-ta_progress', {
					text: this._oRb.getText('UPLOADCOLLECTION_UPLOADING', [p])
				}).addStyleClass('sapMUCProgress');
			} else {
				P.setText(this._oRb.getText('UPLOADCOLLECTION_UPLOADING', [p]));
			}
			return P;
		};
		h.prototype._createIcon = function(i, I, s, t) {
			var T, e, o;
			T = i.getThumbnailUrl();
			if (T) {
				o = new sap.m.Image(I + '-ia_imageHL', {
					src: sap.m.UploadCollection.prototype._getThumbnail(T, s),
					decorative: false,
					alt: this._getAriaLabelForPicture(i)
				}).addStyleClass('sapMUCItemImage');
			} else {
				e = sap.m.UploadCollection.prototype._getThumbnail(undefined, s);
				o = new sap.ui.core.Icon(I + '-ia_iconHL', {
					src: e,
					decorative: false,
					useIconTooltip: false,
					alt: this._getAriaLabelForPicture(i)
				}).addStyleClass('sapMUCItemIcon');
				if (e === h._placeholderCamera) {
					o.addStyleClass('sapMUCItemPlaceholder');
				}
			}
			if (this.sErrorState !== 'Error' && q.trim(i.getProperty('url'))) {
				o.attachPress(function(E) {
					sap.m.UploadCollection.prototype._triggerLink(E, t);
				});
			}
			return o;
		};
		h.prototype._getButtons = function(i, s, I, t) {
			var e, o, j, k, l, E, m;
			e = [];
			if (!this.getInstantUpload()) {
				k = 'deleteButton';
				l = this._createDeleteButton(I, k, i, this.sErrorState, t);
				e.push(l);
				return e;
			}
			if (s === 'Edit') {
				o = sap.ui.getCore().byId(I + '-okButton');
				if (!o) {
					o = new sap.m.Button({
						id: I + '-okButton',
						text: this._oRb.getText('UPLOADCOLLECTION_OKBUTTON_TEXT'),
						type: sap.m.ButtonType.Transparent
					}).addStyleClass('sapMUCOkBtn');
				}
				j = sap.ui.getCore().byId(I + '-cancelButton');
				if (!j) {
					j = new sap.m.Button({
						id: I + '-cancelButton',
						text: this._oRb.getText('UPLOADCOLLECTION_CANCELBUTTON_TEXT'),
						type: sap.m.ButtonType.Transparent
					}).addStyleClass('sapMUCCancelBtn');
				}
				e.push(o);
				e.push(j);
				return e;
			} else if (s === h._uploadingStatus && !(sap.ui.Device.browser.msie && sap.ui.Device.browser.version <= 9)) {
				k = 'terminateButton';
				l = this._createDeleteButton(I, k, i, this.sErrorState, t);
				e.push(l);
				return e;
			} else {
				E = i.getEnableEdit();
				if (this.sErrorState === 'Error') {
					E = false;
				}
				m = sap.ui.getCore().byId(I + '-editButton');
				if (!m) {
					if (i.getVisibleEdit()) {
						m = new sap.m.Button({
							id: I + '-editButton',
							icon: 'sap-icon://edit',
							type: sap.m.ButtonType.Standard,
							enabled: E,
							visible: i.getVisibleEdit(),
							tooltip: this._oRb.getText('UPLOADCOLLECTION_EDITBUTTON_TEXT'),
							press: [i, this._handleEdit, this]
						}).addStyleClass('sapMUCEditBtn');
						e.push(m);
					}
				} else if (!i.getVisibleEdit()) {
					m.destroy();
					m = null;
				} else {
					m.setEnabled(E);
					m.setVisible(i.getVisibleEdit());
					e.push(m);
				}
				k = 'deleteButton';
				if (i.getVisibleDelete()) {
					l = this._createDeleteButton(I, k, i, this.sErrorState, t);
					e.push(l);
				} else {
					l = sap.ui.getCore().byId(I + '-' + k);
					if (!!l) {
						l.destroy();
						l = null;
					}
				}
				return e;
			}
		};
		h.prototype._createDeleteButton = function(i, s, I, e, t) {
			var E, o;
			E = I.getEnableDelete();
			if (e === 'Error') {
				E = false;
			}
			o = sap.ui.getCore().byId(i + '-' + s);
			if (!o) {
				o = new sap.m.Button({
					id: i + '-' + s,
					icon: 'sap-icon://sys-cancel',
					type: sap.m.ButtonType.Standard,
					enabled: E,
					tooltip: this._oRb.getText('UPLOADCOLLECTION_TERMINATEBUTTON_TEXT'),
					visible: I.getVisibleDelete()
				}).addStyleClass('sapMUCDeleteBtn');
				if (s === 'deleteButton') {
					o.setTooltip(this._oRb.getText('UPLOADCOLLECTION_DELETEBUTTON_TEXT'));
					o.attachPress(function(j) {
							this._handleDelete(j, t);
						}
						.bind(t));
				} else if (s === 'terminateButton') {
					o.attachPress(function(j) {
							this._handleTerminate.bind(this)(j, I);
						}
						.bind(t));
				}
			} else {
				o.setEnabled(E);
				o.setVisible(I.getVisibleDelete());
			}
			return o;
		};
		h.prototype._fillList = function(i) {
			var t = this;
			var m = i.length - 1;
			q.each(i, function(I, o) {
				if (!o._status) {
					o._status = h._displayStatus;
				}
				if (!o._percentUploaded && o._status === h._uploadingStatus) {
					o._percentUploaded = 0;
				}
				var l = t._mapItemToListItem(o);
				if (l) {
					if (I === 0 && m === 0) {
						l.addStyleClass('sapMUCListSingleItem');
					} else if (I === 0) {
						l.addStyleClass('sapMUCListFirstItem');
					} else if (I === m) {
						l.addStyleClass('sapMUCListLastItem');
					} else {
						l.addStyleClass('sapMUCListItem');
					}
					t._oList.addAggregation('items', l, true);
					o.attachEvent('selected', t._handleItemSetSelected, t);
				}
			});
			t._oList.attachSelectionChange(t._handleSelectionChange, t);
		};
		h.prototype._clearList = function() {
			if (this._oList) {
				this._oList.destroyAggregation('items', true);
			}
		};
		h.prototype._setNumberOfAttachmentsTitle = function(i) {
			var n = i || 0;
			var t;
			if (this._oItemToUpdate) {
				n--;
			}
			if (this.getNumberOfAttachmentsText()) {
				t = this.getNumberOfAttachmentsText();
			} else {
				t = this._oRb.getText('UPLOADCOLLECTION_ATTACHMENTS', [n]);
			}
			if (!this._oNumberOfAttachmentsTitle) {
				this._oNumberOfAttachmentsTitle = new sap.m.Title(this.getId() + '-numberOfAttachmentsTitle', {
					text: t
				});
			} else {
				this._oNumberOfAttachmentsTitle.setText(t);
			}
		};
		h.prototype._handleDelete = function(e, o) {
			var p = e.getParameters();
			var I = o.getAggregation('items');
			var s = p.id.split('-deleteButton')[0];
			var j = null;
			var k = '';
			var l;
			var m;
			o.sDeletedItemId = s;
			for (var i = 0; i < I.length; i++) {
				if (I[i].sId === s) {
					j = i;
					break;
				}
			}
			if (q.sap.byId(o.sId).hasClass('sapUiSizeCompact')) {
				k = 'sapUiSizeCompact';
			}
			if (o.editModeItem) {
				sap.m.UploadCollection.prototype._handleOk(e, o, o.editModeItem, true);
				if (o.sErrorState === 'Error') {
					return this;
				}
			}
			if (!!I[j] && I[j].getEnableDelete()) {
				l = I[j].getFileName();
				if (!l) {
					m = this._oRb.getText('UPLOADCOLLECTION_DELETE_WITHOUT_FILENAME_TEXT');
				} else {
					m = this._oRb.getText('UPLOADCOLLECTION_DELETE_TEXT', l);
				}
				o._oItemForDelete = I[j];
				o._oItemForDelete._iLineNumber = j;
				sap.m.MessageBox.show(m, {
					title: this._oRb.getText('UPLOADCOLLECTION_DELETE_TITLE'),
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: o._onCloseMessageBoxDeleteItem.bind(o),
					dialogId: 'messageBoxDeleteFile',
					styleClass: k
				});
			}
		};
		h.prototype._onCloseMessageBoxDeleteItem = function(A) {
			this._oItemForDelete._status = h._toBeDeletedStatus;
			if (A === sap.m.MessageBox.Action.OK) {
				if (this.getInstantUpload()) {
					this.fireFileDeleted({
						documentId: this._oItemForDelete.getDocumentId(),
						item: this._oItemForDelete
					});
				} else {
					if (this.aItems.length === 1) {
						this.sFocusId = this._oFileUploader.$().find(':button')[0].id;
					} else {
						if (this._oItemForDelete._iLineNumber < this.aItems.length - 1) {
							this.sFocusId = this.aItems[this._oItemForDelete._iLineNumber + 1].getId() + '-cli';
						} else {
							this.sFocusId = this.aItems[0].getId() + '-cli';
						}
					}
					this._aDeletedItemForPendingUpload.push(this._oItemForDelete);
					this.aItems.splice(this._oItemForDelete._iLineNumber, 1);
					this.removeAggregation('items', this._oItemForDelete, false);
				}
			}
		};
		h.prototype._handleTerminate = function(e, I) {
			var o, j;
			o = new sap.m.List({
				items: [new sap.m.StandardListItem({
					title: I.getFileName(),
					icon: this._getIconFromFilename(I.getFileName())
				})]
			});
			j = new sap.m.Dialog({
				id: this.getId() + 'deleteDialog',
				title: this._oRb.getText('UPLOADCOLLECTION_TERMINATE_TITLE'),
				content: [new sap.m.Text({
					text: this._oRb.getText('UPLOADCOLLECTION_TERMINATE_TEXT')
				}), o],
				buttons: [new sap.m.Button({
					text: this._oRb.getText('UPLOADCOLLECTION_OKBUTTON_TEXT'),
					press: [k, this]
				}), new sap.m.Button({
					text: this._oRb.getText('UPLOADCOLLECTION_CANCELBUTTON_TEXT'),
					press: function() {
						j.close();
					}
				})],
				afterClose: function() {
					j.destroy();
				}
			}).open();

			function k() {
				var A = false;
				for (var i = 0; i < this.aItems.length; i++) {
					if (this.aItems[i]._status === h._uploadingStatus && this.aItems[i]._requestIdName === I._requestIdName) {
						A = true;
						break;
					} else if (I.getFileName() === this.aItems[i].getFileName() && this.aItems[i]._status === h._displayStatus) {
						this.aItems[i]._status = h._toBeDeletedStatus;
						this.fireFileDeleted({
							documentId: this.aItems[i].getDocumentId(),
							item: this.aItems[i]
						});
						break;
					}
				}
				if (A) {
					this._getFileUploader().abort(this._headerParamConst.fileNameRequestIdName, this._encodeToAscii(I.getFileName()) + this.aItems[i]._requestIdName);
				}
				j.close();
				this.invalidate();
			}
		};
		h.prototype._handleEdit = function(e, I) {
			var i, s = I.getId(),
				j = this.aItems.length;
			if (this.editModeItem) {
				sap.m.UploadCollection.prototype._handleOk(e, this, this.editModeItem, false);
			}
			if (this.sErrorState !== 'Error') {
				for (i = 0; i < j; i++) {
					if (this.aItems[i].getId() === s) {
						this.aItems[i]._status = 'Edit';
						break;
					}
				}
				I._status = 'Edit';
				this.editModeItem = e.getSource().getId().split('-editButton')[0];
				this.invalidate();
			}
		};
		h.prototype._handleClick = function(e, o, s) {
			if (e.target.id.lastIndexOf('editButton') < 0) {
				if (e.target.id.lastIndexOf('cancelButton') > 0) {
					sap.m.UploadCollection.prototype._handleCancel(e, o, s);
				} else if (e.target.id.lastIndexOf('ia_imageHL') < 0 && e.target.id.lastIndexOf('ia_iconHL') < 0 && e.target.id.lastIndexOf(
						'deleteButton') < 0 && e.target.id.lastIndexOf('ta_editFileName-inner') < 0) {
					if (e.target.id.lastIndexOf('cli') > 0) {
						o.sFocusId = e.target.id;
					}
					sap.m.UploadCollection.prototype._handleOk(e, o, s, true);
				}
			}
		};
		h.prototype._handleOk = function(e, o, s, t) {
			var T = true;
			var E = document.getElementById(s + '-ta_editFileName-inner');
			var n;
			var S = s.split('-').pop();
			var i = o.aItems[S].getProperty('fileName');
			var j = h.prototype._splitFilename(i);
			var I = sap.ui.getCore().byId(s + '-ta_editFileName');
			var k = o.aItems[S].errorState;
			var l = o.aItems[S].changedFileName;
			if (E !== null) {
				n = E.value.replace(/^\s+/, '');
			}
			var m = e.srcControl ? e.srcControl.getId().split('-') : e.oSource.getId().split('-');
			m = m.slice(0, 5);
			o.sFocusId = m.join('-') + '-cli';
			if (n && (n.length > 0)) {
				o.aItems[S]._status = h._displayStatus;
				if (j.name !== n) {
					if (!o.getSameFilenameAllowed()) {
						if (sap.m.UploadCollection.prototype._checkDoubleFileName(n + j.extension, o.aItems)) {
							I.setProperty('valueState', 'Error', true);
							o.aItems[S]._status = 'Edit';
							o.aItems[S].errorState = 'Error';
							o.aItems[S].changedFileName = n;
							o.sErrorState = 'Error';
							T = false;
							if (k !== 'Error' || l !== n) {
								o.invalidate();
							}
						} else {
							I.setProperty('valueState', 'None', true);
							o.aItems[S].errorState = null;
							o.aItems[S].changedFileName = null;
							o.sErrorState = null;
							o.editModeItem = null;
							if (t) {
								o.invalidate();
							}
						}
					}
					if (T) {
						o._oItemForRename = o.aItems[S];
						o._onEditItemOk.bind(o)(n + j.extension);
					}
				} else {
					o.sErrorState = null;
					o.aItems[S].errorState = null;
					o.editModeItem = null;
					if (t) {
						o.invalidate();
					}
				}
			} else if (E !== null) {
				o.aItems[S]._status = 'Edit';
				o.aItems[S].errorState = 'Error';
				o.aItems[S].changedFileName = n;
				o.sErrorState = 'Error';
				if (k !== 'Error' || l !== n) {
					o.aItems[S].invalidate();
				}
			}
		};
		h.prototype._onEditItemOk = function(n) {
			if (this._oItemForRename) {
				this._oItemForRename.setFileName(n);
				this.fireFileRenamed({
					documentId: this._oItemForRename.getProperty('documentId'),
					fileName: n,
					item: this._oItemForRename
				});
			}
			delete this._oItemForRename;
		};
		h.prototype._handleCancel = function(e, o, s) {
			var S = s.split('-').pop();
			o.aItems[S]._status = h._displayStatus;
			o.aItems[S].errorState = null;
			o.aItems[S].changedFileName = sap.ui.getCore().byId(s + '-ta_editFileName').getProperty('value');
			o.sFocusId = o.editModeItem + '-cli';
			o.sErrorState = null;
			o.editModeItem = null;
			o.invalidate();
		};
		h.prototype._onChange = function(e) {
			if (e) {
				var t = this;
				var r, j, i, s, I, S, k, A;
				this._cAddItems = 0;
				if (sap.ui.Device.browser.msie && sap.ui.Device.browser.version <= 9) {
					var n = e.getParameter('newValue');
					if (!n) {
						return;
					}
					s = n.split(/\" "/)[0];
					if (s.length === 0) {
						return;
					}
				} else {
					j = e.getParameter('files').length;
					if (j === 0) {
						return;
					}
					this._oFileUploader.removeAllAggregation('headerParameters', true);
					this.removeAllAggregation('headerParameters', true);
				}
				this._oFileUploader.removeAllAggregation('parameters', true);
				this.removeAllAggregation('parameters', true);
				if (sap.ui.Device.browser.msie && sap.ui.Device.browser.version <= 9) {
					var o = {
						name: e.getParameter('newValue')
					};
					var p = {
						files: [o]
					};
					this.fireChange({
						getParameter: function(m) {
							if (m === 'files') {
								return [o];
							}
						},
						getParameters: function() {
							return p;
						},
						mParameters: p,
						files: [o]
					});
				} else {
					this.fireChange({
						getParameter: function(m) {
							if (m) {
								return e.getParameter(m);
							}
						},
						getParameters: function() {
							return e.getParameters();
						},
						mParameters: e.getParameters(),
						files: e.getParameter('files')
					});
				}
				var P = this.getAggregation('parameters');
				if (P) {
					q.each(P, function(m, u) {
						var v = new sap.ui.unified.FileUploaderParameter({
							name: u.getProperty('name'),
							value: u.getProperty('value')
						});
						t._oFileUploader.addParameter(v);
					});
				}
				if (!this.getInstantUpload()) {
					S = h._pendingUploadStatus;
				} else {
					S = h._uploadingStatus;
				}
				if (sap.ui.Device.browser.msie && sap.ui.Device.browser.version <= 9) {
					I = new CustUploadCollectionItem({
						fileName: s
					});
					I._status = S;
					I._internalFileIndexWithinFileUploader = 1;
					if (!this.getInstantUpload()) {
						I.setAssociation('fileUploader', this._oFileUploader, true);
						this.insertItem(I);
						this._aFileUploadersForPendingUpload.push(this._oFileUploader);
					} else {
						I._percentUploaded = 0;
					}
					this.aItems.unshift(I);
					this._cAddItems++;
				} else {
					this._requestIdValue = this._requestIdValue + 1;
					r = this._requestIdValue.toString();
					var l = this.getAggregation('headerParameters');
					if (!this.getInstantUpload()) {
						this._aFileUploadersForPendingUpload.push(this._oFileUploader);
					}
					for (i = 0; i < j; i++) {
						I = new CustUploadCollectionItem({
							fileName: e.getParameter('files')[i].name
						});
						I._status = S;
						I._internalFileIndexWithinFileUploader = i + 1;
						I._requestIdName = r;
						if (!this.getInstantUpload()) {
							I.setAssociation('fileUploader', this._oFileUploader, true);
							k = this._oFormatDecimal.format(e.getParameter('files')[i].size);
							A = new d({
								text: k
							});
							I.insertAggregation('attributes', A, true);
							this.insertItem(I);
						} else {
							I._percentUploaded = 0;
						}
						this.aItems.unshift(I);
						this._cAddItems++;
						
						//custom - start
						t._oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
						name: "slug",
						value: I.getFileName()
						//custom - end
					}));
					}
					if (l) {
						q.each(l, function(m, u) {
							t._oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
								name: u.getProperty('name'),
								value: u.getProperty('value')
							}));
						});
					}
					t._oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
						name: this._headerParamConst.requestIdName,
						value: r
					}));

					//custom - start
					//send csrf token with odata call
					t._oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
						name: "x-csrf-token",
						/* eslint-disable sap-no-ui5base-prop */
						value: this.getAggregation("items")[0].oPropagatedProperties.
								oModels.undefined.getHeaders()['x-csrf-token']
						/* eslint-enable sap-no-ui5base-prop */
					}));
					//custom - end
				}
			}
		};
		h.prototype._onFilenameLengthExceed = function(e) {
			var o = {
				name: e.getParameter('fileName')
			};
			var i = [o];
			this.fireFilenameLengthExceed({
				getParameter: function(p) {
					if (p) {
						return e.getParameter(p);
					}
				},
				getParameters: function() {
					return e.getParameters();
				},
				mParameters: e.getParameters(),
				files: i
			});
		};
		h.prototype._onFileSizeExceed = function(e) {
			var o;
			if (sap.ui.Device.browser.msie && sap.ui.Device.browser.version <= 9) {
				var s = e.getParameter('newValue');
				o = {
					name: s
				};
				var p = {
					newValue: s,
					files: [o]
				};
				this.fireFileSizeExceed({
					getParameter: function(P) {
						if (P === 'files') {
							return [o];
						} else if (P === 'newValue') {
							return s;
						}
					},
					getParameters: function() {
						return p;
					},
					mParameters: p,
					files: [o]
				});
			} else {
				o = {
					name: e.getParameter('fileName'),
					fileSize: e.getParameter('fileSize')
				};
				this.fireFileSizeExceed({
					getParameter: function(P) {
						if (P) {
							return e.getParameter(P);
						}
					},
					getParameters: function() {
						return e.getParameters();
					},
					mParameters: e.getParameters(),
					files: [o]
				});
			}
		};
		h.prototype._onTypeMissmatch = function(e) {
			var o = {
				name: e.getParameter('fileName'),
				fileType: e.getParameter('fileType'),
				mimeType: e.getParameter('mimeType')
			};
			var i = [o];
			this.fireTypeMissmatch({
				getParameter: function(p) {
					if (p) {
						return e.getParameter(p);
					}
				},
				getParameters: function() {
					return e.getParameters();
				},
				mParameters: e.getParameters(),
				files: i
			});
		};
		h.prototype._onUploadTerminated = function(e) {
			var i;
			var r = this._getRequestId(e);
			var s = e.getParameter('fileName');
			var j = this.aItems.length;
			for (i = 0; i < j; i++) {
				if (this.aItems[i] && this.aItems[i].getFileName() === s && this.aItems[i]._requestIdName === r && this.aItems[i]._status === h._uploadingStatus) {
					this.aItems.splice(i, 1);
					this.removeItem(i);
					break;
				}
			}
			this.fireUploadTerminated({
				fileName: s,
				getHeaderParameter: this._getHeaderParameterWithinEvent.bind(e)
			});
		};
		h.prototype._onUploadComplete = function(e) {
			if (e) {
				var i, r, u, j, k = m();
				r = this._getRequestId(e);
				u = e.getParameter('fileName');
				if (!u) {
					var l = (e.getSource().getProperty('value')).split(/\" "/);
					u = l[0];
				}
				j = this.aItems.length;
				for (i = 0; i < j; i++) {
					if (!r) {
						if (this.aItems[i].getProperty('fileName') === u && this.aItems[i]._status === h._uploadingStatus && k) {
							this.aItems[i]._percentUploaded = 100;
							this.aItems[i]._status = h._displayStatus;
							this._oItemToUpdate = null;
							break;
						} else if (this.aItems[i].getProperty('fileName') === u && this.aItems[i]._status === h._uploadingStatus) {
							this.aItems.splice(i, 1);
							this._oItemToUpdate = null;
							break;
						}
					} else if (this.aItems[i].getProperty('fileName') === u && this.aItems[i]._requestIdName === r && this.aItems[i]._status === h._uploadingStatus &&
						k) {
						this.aItems[i]._percentUploaded = 100;
						this.aItems[i]._status = h._displayStatus;
						this._oItemToUpdate = null;
						break;
					} else if (this.aItems[i].getProperty('fileName') === u && this.aItems[i]._requestIdName === r && this.aItems[i]._status === h._uploadingStatus ||
						this.aItems[i]._status === h._pendingUploadStatus) {
						this.aItems.splice(i, 1);
						this._oItemToUpdate = null;
						break;
					}
				}
				this.fireUploadComplete({
					getParameter: e.getParameter,
					getParameters: e.getParameters,
					mParameters: e.getParameters(),
					files: [{
						fileName: e.getParameter('fileName') || u,
						responseRaw: e.getParameter('responseRaw'),
						reponse: e.getParameter('response'),
						status: e.getParameter('status'),
						headers: e.getParameter('headers')
					}]
				});
			}
			this.invalidate();

			function m() {
				var R = e.getParameter('status').toString() || '200';
				if (R[0] === '2' || R[0] === '3') {
					return true;
				} else {
					return false;
				}
			}
		};
		h.prototype._onUploadProgress = function(e) {
			if (e) {
				var i, u, p, P, r, j, o, I, $;
				u = e.getParameter('fileName');
				r = this._getRequestId(e);
				P = Math.round(e.getParameter('loaded') / e.getParameter('total') * 100);
				if (P === 100) {
					p = this._oRb.getText('UPLOADCOLLECTION_UPLOAD_COMPLETED');
				} else {
					p = this._oRb.getText('UPLOADCOLLECTION_UPLOADING', [P]);
				}
				j = this.aItems.length;
				for (i = 0; i < j; i++) {
					if (this.aItems[i].getProperty('fileName') === u && this.aItems[i]._requestIdName == r && this.aItems[i]._status === h._uploadingStatus) {
						o = sap.ui.getCore().byId(this.aItems[i].getId() + '-ta_progress');
						if (!!o) {
							o.setText(p);
							this.aItems[i]._percentUploaded = P;
							I = this.aItems[i].getId();
							$ = q.sap.byId(I + '-ia_indicator');
							if (P === 100) {
								$.attr('aria-label', p);
							} else {
								$.attr('aria-valuenow', P);
							}
							break;
						}
					}
				}
			}
		};
		h.prototype._getRequestId = function(e) {
			var o;
			o = e.getParameter('requestHeaders');
			if (!o) {
				return null;
			}
			for (var j = 0; j < o.length; j++) {
				if (o[j].name === this._headerParamConst.requestIdName) {
					return o[j].value;
				}
			}
		};
		h.prototype._getFileUploader = function() {
			var t = this,
				u = this.getInstantUpload();
			if (!u || !this._oFileUploader) {
				var s = (sap.ui.Device.browser.msie && sap.ui.Device.browser.version <= 9) ? false : true;
				this._iFUCounter = this._iFUCounter + 1;
				this._oFileUploader = new sap.ui.unified.FileUploader(this.getId() + '-' + this._iFUCounter + '-uploader', {
					buttonOnly: true,
					buttonText: ' ',
					tooltip: this.getInstantUpload() ? this._oRb.getText('UPLOADCOLLECTION_UPLOAD') : this._oRb.getText('UPLOADCOLLECTION_ADD'),
					iconOnly: true,
					enabled: this.getUploadEnabled(),
					fileType: this.getFileType(),
					icon: 'sap-icon://add',
					iconFirst: false,
					style: 'Transparent',
					maximumFilenameLength: this.getMaximumFilenameLength(),
					maximumFileSize: this.getMaximumFileSize(),
					mimeType: this.getMimeType(),
					multiple: this.getMultiple(),
					name: 'uploadCollection',
					uploadOnChange: u,
					sameFilenameAllowed: true,
					uploadUrl: this.getUploadUrl(),
					useMultipart: false,
					sendXHR: s,
					change: function(e) {
						t._onChange(e);
					},
					filenameLengthExceed: function(e) {
						t._onFilenameLengthExceed(e);
					},
					fileSizeExceed: function(e) {
						t._onFileSizeExceed(e);
					},
					typeMissmatch: function(e) {
						t._onTypeMissmatch(e);
					},
					uploadAborted: function(e) {
						t._onUploadTerminated(e);
					},
					uploadComplete: function(e) {
						t._onUploadComplete(e);
					},
					uploadProgress: function(e) {
						if (t.getInstantUpload()) {
							t._onUploadProgress(e);
						}
					},
					uploadStart: function(e) {
						t._onUploadStart(e);
					}
				});
			}
			return this._oFileUploader;
		};
		h.prototype._onUploadStart = function(e) {
			var r = {},
				i, R, p, s, G;
			this._iUploadStartCallCounter++;
			p = e.getParameter('requestHeaders').length;
			for (i = 0; i < p; i++) {
				if (e.getParameter('requestHeaders')[i].name === this._headerParamConst.requestIdName) {
					R = e.getParameter('requestHeaders')[i].value;
					break;
				}
			}
			s = e.getParameter('fileName');
			r = {
				name: this._headerParamConst.fileNameRequestIdName,
				value: this._encodeToAscii(s) + R
			};
			e.getParameter('requestHeaders').push(r);
			for (i = 0; i < this._aDeletedItemForPendingUpload.length; i++) {
				if (this._aDeletedItemForPendingUpload[i].getAssociation('fileUploader') === e.oSource.sId && this._aDeletedItemForPendingUpload[i].getFileName() ===
					s && this._aDeletedItemForPendingUpload[i]._internalFileIndexWithinFileUploader === this._iUploadStartCallCounter) {
					e.getSource().abort(this._headerParamConst.fileNameRequestIdName, this._encodeToAscii(s) + R);
					return;
				}
			}
			this.fireBeforeUploadStarts({
				fileName: s,
				addHeaderParameter: j,
				getHeaderParameter: k.bind(this)
			});
			if (q.isArray(G)) {
				for (i = 0; i < G.length; i++) {
					if (e.getParameter('requestHeaders')[i].name === G[i].getName()) {
						e.getParameter('requestHeaders')[i].value = G[i].getValue();
					}
				}
			} else if (G instanceof sap.m.UploadCollectionParameter) {
				for (i = 0; i < e.getParameter('requestHeaders').length; i++) {
					if (e.getParameter('requestHeaders')[i].name === G.getName()) {
						e.getParameter('requestHeaders')[i].value = G.getValue();
						break;
					}
				}
			}

			function j(u) {
				var r = {
					name: u.getName(),
					value: u.getValue()
				};
				e.getParameter('requestHeaders').push(r);
			}

			function k(l) {
				G = this._getHeaderParameterWithinEvent.bind(e)(l);
				return G;
			}
		};
		h.prototype._getIconFromFilename = function(s) {
			var e = this._splitFilename(s).extension;
			if (q.type(e) === 'string') {
				e = e.toLowerCase();
			}
			switch (e) {
				case '.bmp':
				case '.jpg':
				case '.jpeg':
				case '.png':
					return h._placeholderCamera;
				case '.csv':
				case '.xls':
				case '.xlsx':
					return 'sap-icon://excel-attachment';
				case '.doc':
				case '.docx':
				case '.odt':
					return 'sap-icon://doc-attachment';
				case '.pdf':
					return 'sap-icon://pdf-attachment';
				case '.ppt':
				case '.pptx':
					return 'sap-icon://ppt-attachment';
				case '.txt':
					return 'sap-icon://document-text';
				default:
					return 'sap-icon://document';
			}
		};
		h.prototype._getThumbnail = function(t, s) {
			if (t) {
				return t;
			} else {
				return this._getIconFromFilename(s);
			}
		};
		h.prototype._triggerLink = function(e, o) {
			var l = null;
			var i;
			if (o.editModeItem) {
				sap.m.UploadCollection.prototype._handleOk(e, o, o.editModeItem, true);
				if (o.sErrorState === 'Error') {
					return this;
				}
				o.sFocusId = e.getParameter('id');
			}
			i = e.oSource.getId().split('-');
			l = i[i.length - 2];
			sap.m.URLHelper.redirect(o.aItems[l].getProperty('url'), true);
		};
		h.prototype.onkeydown = function(e) {
			switch (e.keyCode) {
				case q.sap.KeyCodes.F2:
					sap.m.UploadCollection.prototype._handleF2(e, this);
					break;
				case q.sap.KeyCodes.ESCAPE:
					sap.m.UploadCollection.prototype._handleESC(e, this);
					break;
				case q.sap.KeyCodes.DELETE:
					sap.m.UploadCollection.prototype._handleDEL(e, this);
					break;
				case q.sap.KeyCodes.ENTER:
					sap.m.UploadCollection.prototype._handleENTER(e, this);
					break;
				default:
					return;
			}
			e.setMarked();
		};
		h.prototype._setFocusAfterDeletion = function(e, o) {
			if (!e) {
				return;
			}
			var l = o.aItems.length;
			var s = null;
			if (l === 0) {
				var i = q.sap.byId(o._oFileUploader.sId);
				var j = i.find(':button');
				q.sap.focus(j);
			} else {
				var k = e.split('-').pop();
				if ((l - 1) >= k) {
					s = e + '-cli';
				} else {
					s = o.aItems.pop().sId + '-cli';
				}
				sap.m.UploadCollection.prototype._setFocus2LineItem(s);
				this.sDeletedItemId = null;
			}
		};
		h.prototype._setFocus2LineItem = function(s) {
			q.sap.byId(s).focus();
		};
		h.prototype._handleENTER = function(e, o) {
			var t;
			var l;
			var i;
			if (o.editModeItem) {
				t = e.target.id.split(o.editModeItem).pop();
			} else {
				t = e.target.id.split('-').pop();
			}
			switch (t) {
				case '-ta_editFileName-inner':
				case '-okButton':
					sap.m.UploadCollection.prototype._handleOk(e, o, o.editModeItem, true);
					break;
				case '-cancelButton':
					e.preventDefault();
					sap.m.UploadCollection.prototype._handleCancel(e, o, o.editModeItem);
					break;
				case '-ia_iconHL':
				case '-ia_imageHL':
					var j = o.editModeItem.split('-').pop();
					sap.m.URLHelper.redirect(o.aItems[j].getProperty('url'), true);
					break;
				case 'ia_iconHL':
				case 'ia_imageHL':
				case 'cli':
					l = e.target.id.split(t)[0] + 'ta_filenameHL';
					i = sap.ui.getCore().byId(l);
					if (i.getEnabled()) {
						j = e.target.id.split('-')[2];
						sap.m.URLHelper.redirect(o.aItems[j].getProperty('url'), true);
					}
					break;
				default:
					return;
			}
		};
		h.prototype._handleDEL = function(e, o) {
			if (!o.editModeItem) {
				var i = q.sap.byId(e.target.id);
				var j = i.find("[id$='-deleteButton']");
				var k = sap.ui.getCore().byId(j[0].id);
				k.firePress();
			}
		};
		h.prototype._handleESC = function(e, o) {
			if (o.editModeItem) {
				o.sFocusId = o.editModeItem + '-cli';
				o.aItems[o.editModeItem.split('-').pop()]._status = h._displayStatus;
				sap.m.UploadCollection.prototype._handleCancel(e, o, o.editModeItem);
			}
		};
		h.prototype._handleF2 = function(e, o) {
			var i = sap.ui.getCore().byId(e.target.id);
			if (i !== undefined) {
				if (i._status === h._displayStatus) {
					var j = q.sap.byId(e.target.id);
					var k = j.find("[id$='-editButton']");
					var E = sap.ui.getCore().byId(k[0].id);
					if (E.getEnabled()) {
						if (o.editModeItem) {
							sap.m.UploadCollection.prototype._handleClick(e, o, o.editModeItem);
						}
						if (o.sErrorState !== 'Error') {
							E.firePress();
						}
					}
				} else {
					sap.m.UploadCollection.prototype._handleClick(e, o, o.editModeItem);
				}
			} else if (e.target.id.search(o.editModeItem) === 0) {
				sap.m.UploadCollection.prototype._handleOk(e, o, o.editModeItem, true);
			}
		};
		h.prototype._getFileNames = function(s) {
			if (this.getMultiple() && !(sap.ui.Device.browser.msie && sap.ui.Device.browser.version <= 9)) {
				return s.substring(1, s.length - 2).split(/\" "/);
			} else {
				return s.split(/\" "/);
			}
		};
		h.prototype._checkDoubleFileName = function(s, I) {
			if (I.length === 0 || !s) {
				return false;
			}
			var l = I.length;
			s = s.replace(/^\s+/, '');
			for (var i = 0; i < l; i++) {
				if (s === I[i].getProperty('fileName')) {
					return true;
				}
			}
			return false;
		};
		h.prototype._splitFilename = function(s) {
			var r = {};
			var n = s.split('.');
			if (n.length == 1) {
				r.extension = '';
				r.name = n.pop();
				return r;
			}
			r.extension = '.' + n.pop();
			r.name = n.join('.');
			return r;
		};
		h.prototype._getAriaLabelForPicture = function(i) {
			var t;
			t = (i.getAriaLabelForPicture() || i.getFileName());
			return t;
		};
		h.prototype._getHeaderParameterWithinEvent = function(s) {
			var u = [];
			var r = this.getParameter('requestHeaders');
			var p = r.length;
			var i;
			if (r && s) {
				for (i = 0; i < p; i++) {
					if (r[i].name === s) {
						return new sap.m.UploadCollectionParameter({
							name: r[i].name,
							value: r[i].value
						});
					}
				}
			} else {
				if (r) {
					for (i = 0; i < p; i++) {
						u.push(new sap.m.UploadCollectionParameter({
							name: r[i].name,
							value: r[i].value
						}));
					}
				}
				return u;
			}
		};
		h.prototype._encodeToAscii = function(v) {
			var e = '';
			for (var i = 0; i < v.length; i++) {
				e = e + v.charCodeAt(i);
			}
			return e;
		};
		h.prototype._getUploadCollectionItemByListItem = function(l) {
			var A = this.getItems();
			for (var i = 0; i < A.length; i++) {
				if (A[i].getId() === l.getId().replace('-cli', '')) {
					return A[i];
				}
			}
			return null;
		};
		h.prototype._getUploadCollectionItemById = function(u) {
			var A = this.getItems();
			for (var i = 0; i < A.length; i++) {
				if (A[i].getId() === u) {
					return A[i];
				}
			}
			return null;
		};
		h.prototype._getUploadCollectionItemsByListItems = function(l) {
			var u = [];
			var e = this.getItems();
			if (l) {
				for (var i = 0; i < l.length; i++) {
					for (var j = 0; j < e.length; j++) {
						if (l[i].getId().replace('-cli', '') === e[j].getId()) {
							u.push(e[j]);
							break;
						}
					}
				}
				return u;
			}
			return null;
		};
		h.prototype._setSelectedForItems = function(u, s) {
			if (this.getMode() !== sap.m.ListMode.MultiSelect && s) {
				var e = this.getItems();
				for (var j = 0; j < e.length; j++) {
					e[j].setSelected(false);
				}
			}
			for (var i = 0; i < u.length; i++) {
				u[i].setSelected(s);
			}
		};
		h.prototype._handleItemSetSelected = function(e) {
			var i = e.getSource();
			if (i instanceof CustUploadCollectionItem) {
				var l = this._getListItemById(i.getId() + '-cli');
				if (l) {
					l.setSelected(i.getSelected());
				}
			}
		};
		h.prototype._handleSelectionChange = function(e) {
			var l = e.getParameter('listItem');
			var s = e.getParameter('selected');
			var u = this._getUploadCollectionItemsByListItems(e.getParameter('listItems'));
			var o = this._getUploadCollectionItemByListItem(l);
			if (o && l && u) {
				this.fireSelectionChange({
					selectedItem: o,
					selectedItems: u,
					selected: s
				});
				o.setSelected(l.getSelected());
			}
		};
		h.prototype._getListItemById = function(l) {
			var e = this._oList.getItems();
			for (var i = 0; i < e.length; i++) {
				if (e[i].getId() === l) {
					return e[i];
				}
			}
			return null;
		};
		return h;
	}, true);
},
	"sap/cdp/ums/managerequests/fragments/AlterHistory.fragment.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<core:FragmentDefinition class="sapUiSizeCompact" xmlns:core="sap.ui.core" xmlns="sap.m" xmlns:layout="sap.ui.layout">\r\n  <ResponsivePopover class="sapUiPopupWithPadding" title="{i18n>alterHistory}" placement="Top">\r\n    <content >\r\n      <Table growingScrollToLoad="true" growing="true" id="idValueHelpTable" items="{processObjectModel>AlterationItems}" noDataText="{i18n>noItemForAlter}" fixedLayout="false">\r\n        <columns>\r\n          <Column>\r\n            <Text text="{i18n>alterQty}"/>\r\n          </Column>\r\n          <Column>\r\n            <Text text="{i18n>alterDate}"/>\r\n          </Column>\r\n          <Column>\r\n            <Text text="{i18n>alteredDate}"/>\r\n          </Column>\r\n          <Column>\r\n            <Text text="{i18n>status}"/>\r\n          </Column>\r\n        </columns>\r\n        <ColumnListItem>\r\n          <cells>\r\n            <Text text="{= ${processObjectModel>Quantity} + \' \' +  ${processObjectModel>Unit} }"/>\r\n            <Text text="{= ${processObjectModel>DeliveryDate} ? ${path: \'processObjectModel>DeliveryDate\', type: \'sap.ui.model.type.Date\', formatOptions: { style : \'long\' }} : ${i18n>NotApplicable}}"/>\r\n            <Text text="{= ${processObjectModel>AlterationDate} ? ${path: \'processObjectModel>AlterationDate\', type: \'sap.ui.model.type.Date\', formatOptions: { style : \'long\' }} : ${i18n>NotApplicable}}"/>\r\n            <layout:HorizontalLayout>\r\n              <ToggleButton press="onAlterItemStatus"  text="{processObjectModel>StatusText}"                \r\n                type="Transparent" pressed="{processObjectModel>AlterationItemToggle}" \r\n                enabled="{parts: [{path:\'processObjectModel>CanBePicked\'} ] , formatter : \'.formatter.getAlterButtonEnabled\'}">\r\n              </ToggleButton>\r\n            </layout:HorizontalLayout>\r\n          </cells>\r\n        </ColumnListItem>\r\n      </Table>\r\n    </content>\r\n  </ResponsivePopover>\r\n</core:FragmentDefinition>',
	"sap/cdp/ums/managerequests/fragments/ApproverList.fragment.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<core:FragmentDefinition class="sapUiSizeCompact"\r\n  xmlns="sap.m" xmlns:core="sap.ui.core">\r\n  <Popover showHeader="false" placement="Auto"> \r\n  \t<content>\r\n\t    <List items="{approverModel>/Approvers}">\r\n\t      <items>\r\n\t        <ObjectListItem title="{= ${approverModel>ApproverName} + \' (\' + Math.round(${approverModel>ApproverId}) + \')\'}" >\r\n\t        </ObjectListItem>\r\n\t      </items>\r\n\t    </List>\r\n\t</content>\r\n  </Popover>\r\n</core:FragmentDefinition>',
	"sap/cdp/ums/managerequests/fragments/EmployeeEntitlements.fragment.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<core:FragmentDefinition xmlns:core="sap.ui.core" xmlns="sap.m">\r\n<ColumnListItem>\r\n\t\t\t\t\t\t\t\t<cells>\r\n\t\t\t\t\t\t\t\t\t<ObjectIdentifier title="{Item}"/>\r\n\t\t\t\t\t\t\t\t\t<ObjectIdentifier text="{Size}"/>\r\n\t\t\t\t\t\t\t\t\t<ObjectIdentifier text="{EntitledQuantity}"/>\r\n\t\t\t\t\t\t\t\t\t<ObjectIdentifier text="{InstockQuantity}"/>\r\n\t\t\t\t\t\t\t\t\t<Text text="{path:\'OrderQuantity\', type: \'sap.ui.model.type.Integer\'}"/>\t\t\t\t\t\r\n\t\t\t\t\t\t\t\t</cells>\r\n\t\t\t\t\t\t\t</ColumnListItem>\r\n\t\t\t\t\t\t</core:FragmentDefinition>\r\n\t\t\t\t\t\t',
	"sap/cdp/ums/managerequests/fragments/ItemText.fragment.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<core:FragmentDefinition class="sapUiSizeCompact"\r\n  xmlns="sap.m"\r\n  xmlns:core="sap.ui.core">\r\n  <Popover\r\n    title="{i18n>processObjectItemsCommentText}"\r\n    class="sapUiContentPadding" contentWidth="30%" placement="Auto">\r\n    <TextArea cols="60" rows="4" editable="false" scrollable="true"/>\r\n    <TextArea placeholder="{i18n>enterComments}" cols="60" rows="4" scrollable="true" change="onItemCommentChange" />\r\n  </Popover>\r\n</core:FragmentDefinition>',
	"sap/cdp/ums/managerequests/fragments/PrintOptions.fragment.xml":'<!--\n\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\n\n-->\n<core:FragmentDefinition class="sapUiSizeCompact"\n  xmlns="sap.m" xmlns:core="sap.ui.core">\n  <Popover showHeader="false" placement="Top">\n    <content>\n      <SelectList items="{printModel>/PrintOptions}" itemPress="onPrintRequest" selectionChange="onPrintRequest">\n        <items>\n          <core:Item key="{printModel>PickedDate}" text="{= ${path: \'printModel>PickedDate\', type: \'sap.ui.model.type.DateTime\', formatOptions: { style : \'medium\' }} + \' - \' + ${printModel>Receiver} + \' (\' + Math.round(${printModel>ReceiverId}) + \')\'}"/>\n        </items>\n      </SelectList>\n  </content>\n  </Popover>\n</core:FragmentDefinition>',
	"sap/cdp/ums/managerequests/fragments/Receipt.fragment.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<core:FragmentDefinition\r\n\txmlns="sap.m"\r\n\txmlns:core="sap.ui.core">\r\n\t<SelectDialog\r\n\t\ttitle="{i18n>receiptTo}" \r\n\t\tclass="sapUiPopupWithPadding"\r\n\t\tsearch="handleValueHelpSearch"\r\n\t\tconfirm="handleValueHelpClose"\r\n\t\tcancel="handleValueHelpClose"\r\n\t\titems="{/Employees}">\r\n\t\t\t<StandardListItem title="{Name}" description="{= ( Math.round(${EmployeeId}) ) }" />\r\n\t\t</SelectDialog>\r\n\t</core:FragmentDefinition>',
	"sap/cdp/ums/managerequests/fragments/Settings.fragment.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<core:FragmentDefinition class="sapUiSizeCompact" xmlns:core="sap.ui.core" xmlns="sap.m">\r\n\t<ViewSettingsDialog confirm="onViewConfirm">\r\n\t\t<sortItems>\r\n\t\t\t<ViewSettingsItem id="idSettingsSortType" key="{constants>/SettingsSortKeyType}" \t  text="{i18n>SettingsSortType}"/>\r\n\t\t\t<ViewSettingsItem key="{constants>/SettingsSortKeyFor}"       text="{i18n>SettingsSortRequestedFor}"/>\r\n\t\t\t<ViewSettingsItem key="{constants>/SettingsSortKeyCreatedOn}" text="{i18n>SettingsSortCreatedOn}"/>\r\n\t\t\t<ViewSettingsItem key="{constants>/SettingsSortKeyRequester}" text="{i18n>SettingsSortRequestedBy}"/>\r\n\t\t</sortItems>\r\n\t</ViewSettingsDialog>\r\n</core:FragmentDefinition>',
	"sap/cdp/ums/managerequests/fragments/ValueHelpDialog.fragment.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<core:FragmentDefinition\r\n\txmlns="sap.m"\r\n\txmlns:core="sap.ui.core">\r\n\t<TableSelectDialog\r\n\t\ttitle="{i18n>selectEmployees}" \r\n\t\tsearch="onSearch"\r\n\t\tconfirm="onValueHelpOk"\r\n\t\tclose="onValueHelpOk"\r\n\t\tcancel="onValueHelpCancel"\r\n\t\titems="{/Employees}"\r\n\t\tmultiSelect="true">\r\n\t\t<ColumnListItem>\r\n\t\t\t<cells>\r\n\t\t\t\t<ObjectIdentifier\r\n\t\t\t\t\ttitle="{Name}"\r\n\t\t\t\t\ttext="{= ( Math.round(${EmployeeId}))}" />\r\n\t\t\t\t\t<Text text="{Approver}" visible="{objectView>/bApproverVisible}"/>\r\n\t\t\t\t</cells>\r\n\t\t\t</ColumnListItem>\r\n\t\t\t<columns>\r\n\t\t\t\t<Column >\r\n\t\t\t\t\t<header>\r\n\t\t\t\t\t\t<Text text="{i18n>employees}" tooltip="{i18n>employees}" />\r\n\t\t\t\t\t</header>\r\n\t\t\t\t</Column>\t\t\t\t\t\t\r\n\t\t\t\t<Column >\r\n\t\t\t\t\t<header>\r\n\t\t\t\t\t\t<Text text="{i18n>approvers}" tooltip="{i18n>approver}" visible="{objectView>/bApproverVisible}"/>\r\n\t\t\t\t\t</header>\r\n\t\t\t\t</Column>\t\r\n\t\t\t</columns>\r\n\t\t</TableSelectDialog>\r\n\t</core:FragmentDefinition>',
	"sap/cdp/ums/managerequests/i18n/i18n.properties":'# This is the resource bundle for the Worklist app\r\n\r\n#XTIT: Application name\r\nappTitle=Manage Requests\r\n\r\n#YDES: Application description\r\nappDescription=This application is for Store Admin&#x27;s daily job\r\n\r\n#XTIT: Confirmation Dialog\r\ndlgConfirm = Confirm\r\n\r\n#XTIT: Error dialog title\r\ninfoTitle=Information\r\n\r\n#~~~ New Request Item View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n#XTIT: Title for New Request View\r\nnewObjectTitle=New Request\r\n\r\n#XTIT: Text for Expand All button\r\nexpandAll=Expand All\r\n\r\n#XTIT: Text for Collaps All button\r\ncollapseAll=Collapse All\r\n\r\n#YMSG: Not available\r\nnotAvailable = NA\r\n\r\n#XTIT: Icon tab bar text for log\r\nlog=Log\r\n\r\n#~~~ New Request Item View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n#XTIT:No data text for new Requests\r\nnoEmployeesAdded=No Employees Added\r\n\r\n#XBUT: Delete Button Text\r\ndelete=Delete\r\n\r\n#XBUT: Attachments\r\nattachments:Attachments ({0})\r\n\r\n#XBUT: Notes Button Text\r\nnotes=Notes\r\n\r\n#XTIT: Columns view title\r\nentitledItem=Entitled Item\r\n\r\n#XTIT: Columns view title\r\nitemSize=Size\r\n\r\n#XTIT: Columns View title\r\nremainingQuantity=Remaining\r\n\r\n#XTIT: Columns view title\r\nentitledQuantity=Entitled\r\n\r\n#XTIT: Columns view title\r\nrequestQuantity=Request\r\n\r\n#XTIT: Columns view title\r\ninStockQuantity=In Stock\r\n\r\n\r\n#XTIT: No Data Text for Entitlement table\r\nloadingEntitlements=No Entitlements found\r\n\r\n#~~~ Worklist View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Table view title\r\nworklistViewTitle=Manage Requests\r\n\r\n#XTIT: Table view title\r\nworklistTableTitle=Requests\r\n\r\n#XTIT: Table view title with placeholder for the number of items\r\nworklistTableTitleCount=Requests ({0})\r\n\r\n#XTIT: Status Type FacetFilterList title\r\nStatusFacetFilterListTitle=Status\r\n\r\n#XTIT: Request Type FacetFilterList title\r\nRequestFacetFilterListTitle=Request\r\n\r\n#XTIT: Plant/Store FacetFilterList title\r\nStoreFacetFilterListTitle=Store\r\n\r\n#XTIT: FacetFilterList title Request Type\r\nfacetFilterRequestTypes=Request\r\n\r\n#XTIT: FacetFilterList title Cost Center\r\nfacetFilterCostCenters=Cost Center\r\n\r\n#XTIT: FacetFilterList title EventCode\r\nfacetFilterEventCodes=Event Code\r\n\r\n#XTIT: Reset all filters\r\nresetFilters=Reset Filters\r\n\r\n#XTOL: Reset all filters tooltip\r\nresetFiltersToolTip=Reset all filters\r\n\r\n\r\n#XTIT: The title of the column containing the Type of Requests\r\nTabletypeColumnTitle=Type\r\n\r\n#XTIT: The title of the column containing the Category of Requests\r\nTableCategoryColumnTitle=Category\r\n\r\n#XTIT: The title of the column containing the For Employee and his Id\r\nTableRequestedForColumnTitle=Requested For\r\n\r\n#XTIT: The title of the column containing the For Employee and his Id\r\n#TableLocationColumnTitle=Outstation Indicator\r\n\r\n#XTIT: The title of the column containing \'Requested On\'\r\nTableRequestedOnColumnText=Requested On\r\n\r\n#XTIT: The title of the column containing \'Requester\'\r\nTableRequesterColumnText=Requested By\r\n\r\n#XTIT: The title of the column containing \'Request Id\'\r\nTableRequestIdColumnTitle= Request Number\r\n#XBLI: text for a table with no data\r\ntableNoDataText=No Requests are currently available\r\n\r\n#XLNK: text for link in \'not found\' pages\r\nbackToWorklist=Show Manage Requests\r\n\r\n#XTIT: The placeholder for the search field\r\nSearchFieldText=Employee Name/Id or Request Number\r\n\r\n#XTOL: Tooltip for the Date Range button\r\nDateRangeToolTip = Enter Date Range\r\n#XTOL: Tooltip for the Search button\r\nSearchToolTip =Employee Name/Id or Request Number\r\n#XTOL: Tooltip for the Search button\r\nSortToolTip = Sort\r\n\r\n#XBUT: New Request Button\r\nnewRequest=New Request\r\n\r\n#XTOL: Tooltip for the New Request Button\r\nnewRequestToolTip= Create New Request\r\n\r\n#XTOL: Tooltip for the Message Popover\r\nmessageToolTip= Message Log\r\n\r\n#~~~ Value Help View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Value Help Column Title\r\nemployees=Employees\r\n#XTIT: Value Help Title\r\nselectEmployees=Select Employees\r\n#XTIT: Value Help No data found\r\nnoEmployeesFound=No Employees Found\r\n#XTIT: Value Help Empoyee Id\r\nemployeeID=Number\r\n#XTIT: Value Help Approver\r\napprovers=Approver(s)\r\n\r\n#XTOL: Approvers Tool tip\r\napproversToolTip = Approvers\r\n\r\n#YMSG: Approver mismatch error\r\napproverMismatch=Approvers are not same for all employees. Please choose employees with same Approvers only.\r\n\r\n#YMSG: Max Emp Count Error\r\nmaxEmpCountReached=Maximum number of employees to be added is {0}, cannot add more.\r\n\r\n#XTIT: Receiver title\r\nreceiptTo=Receiver\r\n\r\n#YINS: Place holder instruction for receiver input\r\nreceiver= Enter Receiver\r\n\r\n#XBUT: Value Help Buttons\r\nok=Ok\r\n\r\n#XTIT\r\n#DefaultStatusTypeText=Ready - Not Used\r\n\r\n#YMSG\r\nDateRangeMessage=Date Range cannot be empty/set to 1 Day interval, hence Default Date Range is set.\r\n\r\n#~~~ Settings Fragment ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n#XTIT: The title of the sort field containing \'Type\'\r\nSettingsSortType= Type\r\n#XTIT: The title of the sort field containing \'Requested For\'\r\nSettingsSortRequestedFor= Requested For\r\n#XTIT: The title of the sort field containing \'Created On\'\r\nSettingsSortCreatedOn= Created On\r\n#XTIT: The title of the sort field containing \'Requested By\'\r\nSettingsSortRequestedBy= Requested By\r\n\r\n#~~~ Object View ~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Object view title\r\nprocessObjectTitle=Request Details\r\n\r\n#XBUT: Add Employees\r\naddEmployees=Add Employees\r\n\r\n#YINS: Place holder instruction for Event Code combo box\r\ncmbEvntCodePlaceHolder = Choose an Event Code\r\n\r\n#YINS: Place holder instruction for Cost Center combo box\r\ncmbCostCenterPlaceHolder = Choose a Cost Center\r\n\r\n#YINS: Place holder instruction for Plant combo box\r\ncmbPlantPlaceHolder = Choose a Plant\r\n\r\n#YINS: Instruction text for the combo box errors\r\ncmbWarning = Please choose from the List or Leave blank\r\n\r\n#YINS: Instruction text for the combo box errors\r\ncmbError = Please choose from the List\r\n\r\n#YMSG: Error Message triggered when no Order Quantity is entered\r\norderQuantityError = Please enter Order Quantity for all employees before proceeding.\r\n\r\n#YMSG: Success Message for saving of Request.\r\nsaveRequestSuccess = The request {0} has been successfully saved.\r\n\r\n#YMSG: Success Message on submitting of Request\r\nsubmitRequestSuccess = The request {0} has been successfully submitted.\r\n\r\n#YMSG: Error Message for saving of Request\r\nsaveRequestError = Error while saving the Request.\r\n\r\n#YMSG: Error Message for upload\r\nworkflowError = Error in workflow trigger for request {0}. Request is available in Rejected status.\r\n\r\n#YMSG: Error Message for workflow \r\nattachmentError = Error in uploading attachments for request {0}. Request is available in Rejected status.\r\n\r\n#YMSG: Error Message for attachments if file size exceeds 9Mb \r\nattachmentFileSizeError = Attachments size should be less than 9 Mb. Request rejected.\r\n\r\n#YMSG: Error Message for attachment file type mismatch\r\nfilemismatcherror = The file type *.{0} is not supported.\r\n\r\n#YMSG: Error Message for saving of Request\r\nconfirmCancel = You have pressed Cancel, all the changes will be lost. Would you like to proceed?\r\n\r\n#YMSG: Error Message for saving of Request\r\nconfirmBack = You have pressed Back, all the changes will be lost. Would you like to proceed?\r\n\r\n#YMSG: Information popup message text\r\nInfoUniformBadgeMsg=Please send the First Name as per Passport to be printed on badge.\r\n\r\n#YMSG: Error Message for saving of Request\r\nconfirmSave = You have pressed Save, all the changes will be Saved. Would you like to proceed?\r\n\r\n#YMSG: Error Message for saving of Request\r\nconfirmSubmit = You have pressed Submit, all the changes will be submitted. Would you like to proceed?\r\n\r\n#YMSG: Confirmation Message for deleting an employee\r\nconfirmDelete = You have pressed Delete, the record will be deleted. Would you like to proceed?\r\n\r\n#YMSG: No Entitlements\r\nmsgNoEntitlements = No Entitlements Found\r\n\r\n#YMSG: No Entitlements for employees\r\nmsgNoEntitlEmployee = No Entitlements found for the following Employees\r\n\r\n#~~~ Process Object View ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTOL: Refresh Button Tool Tip\r\nrefreshToolTip=Refresh Request\r\n\r\n#XTOL: Print Button Tool Tip\r\nprintToolTip=Print Request\r\n\r\n#XTOL: Submit Button Tool Tip\r\nsubmitToolTip=Submit Request\r\n\r\n#XTIT: Process Object view - Ready Text\r\nprocessObjectReadyState=Ready\r\n\r\n#XTIT: Process Object view - Category Text\r\nprocessObjectCategoryType=Category\r\n\r\n#XTIT: Process Object view - Requester Text\r\nprocessObjectRequester=Requester\r\n\r\n#XTIT: Process Object view - For Employee Text\r\nprocessObjectForEmployee=For\r\n\r\n#XTIT: Process Object view - Created On Text\r\nprocessObjectCreatedOn=Created On\r\n\r\n#XTIT: Process Object view - Final Setllement Flag\r\nfinalSettlement=Final Settlement\r\n\r\n#XTIT: The title of the column containing the Request Item\r\nProcessObjectItemTableColumnTitle=Item\r\n\r\n#XTIT: The title of the column containing the Request Item Size\r\nProcessObjectSizeTableColumnTitle=Size\r\n\r\n#XTIT: The title of the column containing the Request Item Storage Location\r\nProcessObjectStorageLocationColumnTitle=Storage Location\r\n\r\n#XTIT: The title of the column containing the Picked Quantity\r\nProcessObjectPickedQtyTableColumnTitle=Picked\r\n\r\n#XTIT: The title of the column containing the Requested Quantity\r\nProcessObjectRequestedQtyTableColumnTitle=Requested\r\n\r\n#XTIT: The title of the column containing the Pending Quantity\r\nProcessObjectPendingQtyTableColumnTitle=Pending\r\n\r\n#XTIT: The title of the column containing the In Stock Quantity\r\nProcessObjectInStockQtyTableColumnTitle=In Stock\r\n\r\n#XTIT: The title of the column containing the Pick Up Quantity\r\nProcessObjectPickUpQtyTableColumnTitle=To be Picked Up\r\n\r\n#XTIT: The title of the column containing the Alteration Quantity\r\nprocessObjectAlterationQuantityTableColumnTitle=Alter\r\n\r\n#XTIT: The title of the column for Custom Tailoring\r\nprocessObjectCustomTailoringColumnTitle=Tailoring\r\n\r\n#XTIT: The title of the column for Used\r\nprocessObjectUsedColumnTitle=Condition\r\n\r\n#XTIT: The title of the column for Purchase Price\r\nprocessObjectPurchaseTableColumnTitle=Price\r\n\r\n#XTIT: Columns view title\r\namountTableColumnTitle=Amount\r\n\r\n#XTIT: Columns view title\r\nalteredStatusText=Altered\r\n#XTIT: Columns view title\r\npickedUpStatusText=Picked Up\r\n\r\n#XTIT: The title of the column for Alter Date\r\nalterDate=Alteration Due Date\r\n#XTIT: The title of the column for status\r\nstatus=Status\r\n\r\n#XTIT: The title of the column for Delivery Date\r\ndeliveryDate=Delivery \r\n\r\n#XTIT: The title of the column for Collected Date\r\ncollectedDate=Collection \r\n\r\n#XTIT: Text for altered toggle state\r\nprocessAltered=Altered\r\n\r\n#XTIT: Text for pickedup toggle state\r\nprocessPickedUp=Picked Up\r\n\r\n#XTIT: The title of the column for Alter Quantity\r\nalterQty=Altered\r\n#XTIT: The title for altered date column\r\nalteredDate=Altered On\r\n\r\n#XTIT: The title of the column for Alter History\r\nalterHistory=Alteration Items\r\n\r\n#XTIT: The text which no item is available for Alteration\r\nnoItemForAlter= No Alteration History Available.\r\n\r\n#XTIT: The title of the column containing the Alteration Quantity\r\nquantity=Qty.\r\n\r\n#YMSG: Message for value state error\r\nfloatQuantityError= Please enter a whole number\r\n\r\n#YMSG: Message for value state error\r\nquantityErrorText=Please enter positive number for quantity field\r\n\r\n#YMSG: Message for value state error - PickUp Quantity\r\npickUpQuantityErrorText=Please enter PickUp Quantity less than or equal to Remaining Quantity\r\n\r\n#YMSG: Message for value state error - Order/Return Quantity - During Creation\r\norderQuantityErrorText=Please enter Quantity less than or equal to Remaining Quantity\r\n\r\n#YMSG: Message for value state error - PickUp Quantity\r\nreturnQuantityErrorText=Please enter Return Quantity less than or equal to Picked Quantity\r\n\r\n#YMSG: Message for value state error - Exchange Quantity\r\nexchangeQuantityErrorText=Please enter Exchange Quantity less than or equal to Picked Quantity\r\n\r\n#YMSG: Message for value state error - ALteration Quantity\r\nalterationQuantityErrorText=Please enter Alteration Quantity less than or equal to Picked Quantity\r\n\r\n#YMSG: Message for Invalid UI state\r\ninvalidUIError=Please correct the error before submitting request.\r\n\r\n#YMSG: Message for Invalid UI state\r\nreceiverMissing=Please choose a receiver before proceeding.\r\n\r\n#YMSG: Message for Invalid UI state - Missing Alteration or Exchange Process\r\nmissingAltExchProcess=No action has been taken. Enter alteration or exchange quantity or change the status of an altered item.\r\n\r\n#YMSG: Message for missing Storage Location in case of Issue/Return\r\nmissingStorageLoc=Please choose a Storage Location and Pickup or Return quantity before submitting.\r\n\r\n#YMSG: Message for Invalid UI state - Return Process not possible\r\nreturnProcessError=Submit process is not possible beacuse the entire quantity is returned\r\n\r\n#XTIT: The title of the column containing the Alteration Date\r\nprocessObjectAlterationDateTableColumnTitle=Alteration Due\r\n\r\n#XTIT: The title of the column containing the Exchange Action\r\nProcessObjectExchangeButtonTableColumnTitle=Exchange\r\n\r\n#XTIT: The title of the column containing the Exchange Quantity\r\nProcessObjectExchangeQuantityTableColumnTitle=Exchange\r\n\r\n#XTIT: The title of the column containing the Item text\r\nprocessObjectItemTextButtonTableColumnTitle=Text\r\n\r\n#XBUT: Text for Items Text\r\nprocessObjectItemsCommentText=Comments\r\n\r\n#XBUT: TItle for Custom Tailoring toggle button\r\nprocessButCustomTailoring=Custom\r\n\r\n#XBUT: TItle for Custom Tailoring toggle button\r\nprocessButStandardTailoring=Standard\r\n\r\n#XBUT: TItle for Used toggle button\r\nprocessButUsed=Used\r\n\r\n#XBUT: TItle for unUsed toggle button\r\nprocessButUnUsed=Unused\r\n\r\n#XTIT: Placeholder for attachment text\r\nprocessObjectAttachmentPlaceholder=Attachments go here ...\r\n\r\n#XTIT: Placeholder for Header text\r\nprocessObjectHeaderTextPlaceholder=Header Text goes here...\r\n\r\n#XTIT: Placeholder for user comments box\r\nenterComments=Enter your comments here..\r\n\r\n\r\n#XTIT: Placeholder for Log\r\nprocessObjectLogPlaceholder=Log goes here...\r\n\r\n#XTIT: The title of the column containing the Picked Column\r\nprocessObjectPickedRequestedColumnTitle=Picked\r\n\r\n\r\n#XTIT: The title of the column containing the Returned Column\r\nprocessObjectReturnedColumnTitle=To be Returned\r\n\r\n#XTIT: The title of the column containing the Picked quantity\r\npickUpQtyTableColumnTitle=Quantity to be Picked\r\n\r\n#XTIT: The title of the column containing the Returned quantity\r\nreturnQtyTableColumnTitle=Quantity to be Returned\r\n\r\n#XTIT: The header title containing the Returned Column\r\nprocessObjectHeaderReturnQty=Qty Returned/Qty Pending\r\n\r\n#XTIT: The header title containing the Issued Column\r\nprocessObjectHeaderIssueQty=Qty Issued/Qty Pending\r\n\r\n#XTIT: The title of the column containing the Return Quantity Column\r\nprocessObjectReturnQuantityColumnTitle=Returned\r\n\r\n#XTIT: The title of the value help for receipt valuehelp box\r\nprocessReceiptTo=Receipt Given To \r\n\r\n#XTIT: The Not Applicable Value Text\r\nNotApplicable=Not Applicable\r\n\r\n#XTIT: The Remaining Text\r\nunitsRemainingText=Remaining\r\n\r\n#XTIT: The Gender Text\r\ngender=Gender\r\n\r\n#XTIT: The Position Text\r\nposition=Position\r\n\r\n#XTIT: The Location Text\r\nlocation=Location\r\n\r\n#XTIT: The Department Text\r\ndepartment=Department\r\n\r\n#XBUT: Text for Issue Button\r\nissue=Issue\r\n\r\n#XTOL: Items Icon Tab Filter tooltip\r\nreservationItemTooltip=Reservation Items\r\n\r\n#XTOL: Items Icon Tab Filter tooltip\r\nattachmentTooltip=Attachments\r\n\r\n#XTOL: Items Icon Tab Filter tooltip\r\nreservationTooltip=Reservation Header Text\r\n\r\n#XTOL: Items Icon Tab Filter tooltip\r\nreservationHistoryTooltip=Reservation Log\r\n\r\n#XTIT: The \'of\' separator text\r\nprocessObjectViewOfText=of\r\n\r\n#XTIT: Label for added on field\r\naddedOn=Added On\r\n\r\n#XTIT: Label for added by field\r\naddedBy=Added By\r\n\r\n#XTIT: Label for filename field\r\nfilename=Filename\r\n\r\n#XTIT: text for a table with no data\r\nnoAttachmentsText=No attachments available\r\n\r\n#~~~ Footer Options ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n\r\n#XBUT: Text for Save Button\r\nsave=Save\r\n\r\n#XBUT:Text for the Submit Button\r\nsubmit=Submit\r\n\r\n#XBUT:Text for the Cancel Button\r\ncancel=Cancel\r\n\r\n#XBUT:Text for the Cancel Request Button\r\ncancelRequest=Cancel Request\r\n\r\n#XBUT:Text for the Refresh Request Button\r\nrefresh=Refresh\r\n\r\n#YMSG: Dialog Message - Cancel Request Confirmation\r\nconfirmCancelRequest= Do you want to Cancel Request?\r\n\r\n#YMSG: Success Message for Cancellation of Request with Id of Request ;\r\ncancelSuccess = Request {0} has been Cancelled\r\n\r\n#YMSG: Success Message for Issue/Return of Request with Id of Request ;\r\nissueReturnSuccess = Request {0} has been Updated\r\n\r\n#XBUT:Text for the Print Button\r\nprint=Print\r\n\r\n#XBUT:Text for the Sign Button\r\nsign=Sign and Submit\r\n\r\n#XTOL: Tooltip for the save button\r\nsaveTool=Save as Draft\r\n\r\n#XTOL: Tooltip for the sign and submit button\r\nsignTooltip=Sign and Submit Request\r\n\r\n#XTOL: Tooltip for the Cancel button\r\ncancelToolTip=Cancel Request\r\n\r\n#XTOL: Tooltip for the share button\r\nshareTooltip=Share\r\n\r\n#XTIT: Send E-Mail subject\r\nshareSendEmailWorklistSubject=<Email subject PLEASE REPLACE ACCORDING TO YOUR USE CASE>\r\n\r\n#YMSG: Send E-Mail message\r\nshareSendEmailWorklistMessage=<Email body PLEASE REPLACE ACCORDING TO YOUR USE CASE>\\r\\n{0}\r\n\r\n#XTIT: Send E-Mail subject\r\nshareSendEmailObjectSubject=<Email subject including object identifier PLEASE REPLACE ACCORDING TO YOUR USE CASE> {0}\r\n\r\n#YMSG: Send E-Mail message\r\nshareSendEmailObjectMessage=<Email body PLEASE REPLACE ACCORDING TO YOUR USE CASE> {0} (id: {1})\\r\\n{2}\r\n\r\n\r\n#~~~ Not Found View ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#XTIT: Not found view title\r\nnotFoundTitle=Not Found\r\n\r\n#YMSG: The Requests not found text is displayed when there is no Requests with this id\r\nnoObjectFoundText=This Requests is not available\r\n\r\n#YMSG: The Requests not available text is displayed when there is no data when starting the app\r\nnoObjectsAvailableText=No Requests are currently available\r\n\r\n#YMSG: The not found text is displayed when there was an error loading the resource (404 error)\r\nnotFoundText=The requested resource was not found\r\n\r\n#~~~ Error Handling ~~~~~~~~~~~~~~~~~~~~~~~\r\n\r\n#YMSG: Error dialog description\r\nerrorText=Sorry, a technical error occurred! Please try again later.\r\n\r\n#XTIT: Error dialog title\r\nerrorTitle=Error occurred\r\n\r\n#YMSG: Error popup message text\r\nerrorMessageAttachment=Request can not be submitted. Attachment is needed.\r\n\r\n#XTIT: Error Message Box title\r\nERROR_TEXT_TITLE= Service failed\r\n\r\n#XTIT: Error Message Box title\r\nSERVICE_ERROR_MSG= Message : {0} \\n\r\n\r\n#XTIT: Error Message Box title\r\nSERVICE_ERROR_STATUS_CODE= Status Code : {0} \\n\r\n\r\n#XTIT: Error Message Box title\r\nSERVICE_ERROR_STATUS_TXT= Status Text : {0} \\n\r\n\r\n#XTIT: Error Message Box title\r\nSERVICE_ERROR_RESPONSE_MSG= Response Message : {0} \\n\r\n\r\n#XTIT: Error Message Box title\r\nSERVICE_ERROR_REASON_TXT= \\n Reason : \\n\r\n\r\n#XTIT: Error Message Box title\r\nSERVICE_ERROR_REASON_VALUE= {0} \\n\r\n\r\n#XMSG: Error Message Box message text\r\nERROR_TEXT_MSG= Service request failed for one or more actions.',
	"sap/cdp/ums/managerequests/localService/mockserver.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/core/util/MockServer"
], function(MockServer) {
	"use strict";
	var oMockServer,
		_sAppModulePath = "sap/cdp/ums/managerequests/",
		_sJsonFilesModulePath = _sAppModulePath + "localService/mockdata",
		_sMetadataUrl = _sAppModulePath + "localService/metadata",
		_sMainDataSourceUrl = "/here/goes/your/serviceurl/";

	return {

		/**
		 * Initializes the mock server.
		 * You can configure the delay with the URL parameter "serverDelay".
		 * The local mock data in this folder is returned instead of the real data for testing.
		 * @public
		 */
		init: function() {
			var oUriParameters = jQuery.sap.getUriParameters(),
				sJsonFilesUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath),
				sEntity = "Requests",
				sErrorParam = oUriParameters.get("errorType"),
				iErrorCode = sErrorParam === "badRequest" ? 400 : 500,
				sMetadataUrl = jQuery.sap.getModulePath(_sMetadataUrl, ".xml");

			oMockServer = new MockServer({
				rootUri: _sMainDataSourceUrl
			});

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oUriParameters.get("serverDelay") || 1000)
			});

			// load local mock data
			oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sJsonFilesUrl,
				bGenerateMissingMockData: true
			});

			var aRequests = oMockServer.getRequests(),
				fnResponse = function(iErrCode, sMessage, aRequest) {
					aRequest.response = function(oXhr) {
						oXhr.respond(iErrCode, {
							"Content-Type": "text/plain;charset=utf-8"
						}, sMessage);
					};
				};

			// handling the metadata error test
			if (oUriParameters.get("metadataError")) {
				aRequests.forEach(function(aEntry) {
					if (aEntry.path.toString().indexOf("$metadata") > -1) {
						fnResponse(500, "metadata Error", aEntry);
					}
				});
			}

			// Handling request errors
			if (sErrorParam) {
				aRequests.forEach(function(aEntry) {
					if (aEntry.path.toString().indexOf(sEntity) > -1) {
						fnResponse(iErrorCode, sErrorParam, aEntry);
					}
				});
			}
			oMockServer.start();

			jQuery.sap.log.info("Running the app with mock data");
		},

		/**
		 * @public returns the mockserver of the app, should be used in integration tests
		 * @returns {sap.ui.core.util.MockServer} the mockserver instance
		 */
		getMockServer: function() {
			return oMockServer;
		}
	};

});
},
	"sap/cdp/ums/managerequests/model/formatter.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([], function() {
  "use strict";

  return {
    /**
     * Control the Enabled property of Custom tailoring Button     
     * @param {Boolean} bCustomTailorEnabled Custom Tailor Enabled Flag
     * @param {Boolean} bIsReadOnly Read Only Flag
     * @param {Boolean} bCancellationStatus Item Cancellation Status
     * @return {Boolean} value - True/False  - The current state of button
     * @public
     */
    getCustomTailoredButtonEnabled: function(bCustomTailorEnabled, bIsReadOnly,bCancellationStatus) {

      if (bCustomTailorEnabled === undefined || bIsReadOnly === undefined || bCancellationStatus === undefined ||
        bCustomTailorEnabled === null || bIsReadOnly === null || bCancellationStatus === null ) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bCustomTailorEnabled.constructor !== Boolean || bIsReadOnly.constructor !== Boolean || bCancellationStatus.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return false;
      } else {

        if (bCancellationStatus){
        return false;
        } else {
        // If control reaches here then,
        // backend determines and sends whether Custom Tailoring has to be enabled or not
        if (bCustomTailorEnabled) {
          return true;
        } else {
          return false;
        }
        }
      }
    },
    /**
     * Control the Enabled property of Item Condition (Used/Unused) Button     
     * @param {Boolean} bIsReadOnly Read Only Flag
     * @param {Boolean} bConditionEnabled Used/Unused Condition Enabled Flag
     * @param {Boolean} bCancellationStatus Item Cancellation Status
     * @return {Boolean} value - True/False  - The current state of button
     * @public
     */
    getUsedButtonEnabled: function(bIsReadOnly, bConditionEnabled,bCancellationStatus) {

      if (bIsReadOnly === undefined || bIsReadOnly === null || bCancellationStatus === undefined ||
        bConditionEnabled === undefined || bConditionEnabled === null || bCancellationStatus === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bIsReadOnly.constructor !== Boolean ||
        bConditionEnabled.constructor !== Boolean || bCancellationStatus.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return false;
      } else {
      if(bCancellationStatus){
      return false;
      }else {
        // If control reaches here then,
        // backend determines and sends whether condition change has to be enabled or not
        if (bConditionEnabled) {
          return true;
        } else {
          return false;
        }
      }
      }

    },
     /**
     * Control the Visible property of Size Select Control   - Process Screen 
     * Sets the Visible property of 'Select' Control for Size
     * At one time either Select or Text will be visbile for Item Size
     * @param {Boolean} bIsReadOnly Read Only Flag
     * @param {Boolean} bSizeRelevant Item Size Relevance flag
     * @param {Boolean} bCancellationStatus Item Cancellation Status
     * @return {Boolean} value - True/False  - current visibility of control
     * @public
     */
    getSizeSelectVisible: function(bIsReadOnly, bSizeRelevant,bCancellationStatus) {

      if (bIsReadOnly === undefined || bSizeRelevant === undefined || bCancellationStatus === undefined ||
        bIsReadOnly === null || bSizeRelevant === null || bCancellationStatus === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bIsReadOnly.constructor !== Boolean || bSizeRelevant.constructor !== Boolean || bCancellationStatus.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return false;
      } else {
      if (bCancellationStatus){
      return false; }
      else {
        // If control reaches here then,
        // Check whether the material is relevant for Size or not
        if (bSizeRelevant) {
          return true;
        } else {
          return false;
        }
      }
      }
    },
    /**
     * Control the Visible property of Size Text Control  - Process Screen 
     * Sets the Visible property of 'Text' Control for Size
     * At one time either Select or Text will be visbile for Item Size
     * @param {Boolean} bIsReadOnly Read Only Flag
     * @param {Boolean} bSizeRelevant Item Size Relevance flag
     * @param {Boolean} bCancellationStatus Item Cancellation Status
     * @return {Boolean} value - True/False  - current visibility of control
     * @public
     */    
    getSizeTextVisible: function(bIsReadOnly, bSizeRelevant,bCancellationStatus) {

      if (bIsReadOnly === undefined || bSizeRelevant === undefined || bCancellationStatus === undefined ||
        bIsReadOnly === null || bSizeRelevant === null || bCancellationStatus === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bIsReadOnly.constructor !== Boolean || bSizeRelevant.constructor !== Boolean || bCancellationStatus.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return true;
      } else {
      if(bCancellationStatus){
       return true; }
      else {
        // If control reaches here then,
        // Check whether the material is relevant for Size or not
        if (bSizeRelevant) {
          return false;
        } else {
          return true;
        }
      }
      }
    },
    /**
     * Control the Visible property of Size Select Control  - Object Screen
     * Sets the Visible property of 'Select' Control for Size
     * At one time either Select or Text will be visbile for Item Size
     * @param {Boolean} bIsReadOnly Read Only Flag
     * @param {Boolean} bSizeRelevant Item Size Relevance flag     
     * @return {Boolean} value - True/False  - current visibility of control
     * @public
     */     
    getCreateSizeSelectVisible: function(bIsReadOnly, bSizeRelevant) {

      if (bIsReadOnly === undefined || bSizeRelevant === undefined || 
        bIsReadOnly === null || bSizeRelevant === null ) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bIsReadOnly.constructor !== Boolean || bSizeRelevant.constructor !== Boolean ) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return false;
      } else {      
        // If control reaches here then,
        // Check whether the material is relevant for Size or not
        if (bSizeRelevant) {
          return true;
        } else {
          return false;
        }
      
      }
    },
    /**
     * Control the Visible property of Size Text Control  - Object Screen
     * Sets the Visible property of 'Text' Control for Size
     * At one time either Select or Text will be visbile for Item Size
     * @param {Boolean} bIsReadOnly Read Only Flag
     * @param {Boolean} bSizeRelevant Item Size Relevance flag     
     * @return {Boolean} value - True/False  - current visibility of control
     * @public
     */       
    getCreateSizeTextVisible: function(bIsReadOnly, bSizeRelevant) {

      if (bIsReadOnly === undefined || bSizeRelevant === undefined ||
        bIsReadOnly === null || bSizeRelevant === null ) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bIsReadOnly.constructor !== Boolean || bSizeRelevant.constructor !== Boolean ) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return true;
      } else {      
        // If control reaches here then,
        // Check whether the material is relevant for Size or not
        if (bSizeRelevant) {
          return false;
        } else {
          return true;
        }      
      }
    },
    /**
     * Control the Visible property of Used Storage Location Control 
     * Sets the Visible property of 'Select' Control for Used Storage Location
     * At one time either Select or Text will be visbile for Storage Location     
     * @param {Boolean} bIsReadOnly Read Only Flag
     * @param {Boolean} bStorageLocationEnabled Storage Location Enabled Flag
     * @param {Boolean} bCancellationStatus Item Cancellation Status
     * @param {Boolean} bUsed Used Flag
     * @return {Boolean} value - True/False  - current visibility of control
     * @public
     */           
    getUsedStorageLocationSelectVisible: function(bIsReadOnly, bStorageLocationEnabled, bCancellationStatus, bUsed){


      if (bIsReadOnly === undefined || bStorageLocationEnabled === undefined || bCancellationStatus === undefined || bUsed === undefined ||
        bIsReadOnly === null || bStorageLocationEnabled === null || bCancellationStatus === null || bUsed === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bIsReadOnly.constructor !== Boolean || bStorageLocationEnabled.constructor !== Boolean || bCancellationStatus.constructor !== Boolean
        || bUsed.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return false;
      } else {
      if (bCancellationStatus){
      return false; }
      else {
        // If control reaches here then,
        // Check whether the Storage location input is enabled
        if (bStorageLocationEnabled) {
          // Check if the 'Item Condition' is Used - then only display this array
          if (bUsed){
          return true;} 
          else {
            return false;
          }
        } else {
          return false;
        }
      }
      }

    },
    /**
     * Control the Visible property of Unused Storage Location Control 
     * Sets the Visible property of 'Select' Control for Unused Storage Location
     * At one time either Select or Text will be visbile for Storage Location   
     * @param {Boolean} bIsReadOnly Read Only Flag
     * @param {Boolean} bStorageLocationEnabled Storage Location Enabled Flag
     * @param {Boolean} bCancellationStatus Item Cancellation Status
     * @param {Boolean} bUsed Used Flag
     * @return {Boolean} value - True/False  - current visibility of control
     * @public
     */         
    getUnusedStorageLocationSelectVisible: function(bIsReadOnly, bStorageLocationEnabled, bCancellationStatus, bUsed){


      if (bIsReadOnly === undefined || bStorageLocationEnabled === undefined || bCancellationStatus === undefined || bUsed === undefined || 
        bIsReadOnly === null || bStorageLocationEnabled === null || bCancellationStatus === null || bUsed === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bIsReadOnly.constructor !== Boolean || bStorageLocationEnabled.constructor !== Boolean || bCancellationStatus.constructor !== Boolean 
        || bUsed.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return false;
      } else {
      if (bCancellationStatus){
      return false; }
      else {
        // If control reaches here then,
        // Check whether the Storage location input is enabled
        if (bStorageLocationEnabled) {
           // Check if the 'Item Condition' is Unused - then only display this array
          if (!bUsed){
          return true;} 
          else {
            return false;
          }
          
        } else {
          return false;
        }
      }
      }

    },
    /**
     * Control the Visible property of Storage Location Text Control 
     * Sets the Visible property of 'Text' Control for Storage Location
     * At one time either Select or Text will be visbile for Storage Location
     * @param {Boolean} bIsReadOnly Read Only Flag
     * @param {Boolean} bStorageLocationEnabled Storage Location Enabled Flag
     * @param {Boolean} bCancellationStatus Item Cancellation Status     
     * @return {Boolean} value - True/False  - current visibility of control
     * @public
     */         
    getStorageLocationTextVisible: function(bIsReadOnly, bStorageLocationEnabled, bCancellationStatus){

            if (bIsReadOnly === undefined || bStorageLocationEnabled === undefined || bCancellationStatus === undefined ||
        bIsReadOnly === null || bStorageLocationEnabled === null || bCancellationStatus === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bIsReadOnly.constructor !== Boolean || bStorageLocationEnabled.constructor !== Boolean || bCancellationStatus.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return true;
      } else {
      if(bCancellationStatus){
       return true; }
      else {
         // If control reaches here then,
        // Check whether the Storage location input is enabled
        if (bStorageLocationEnabled) {
          return false;
        } else {
          return true;
        }
      }
      }

    },
    /**
     * Sets the Enabled state of the Pick Up Quantity Column     
     * @param   {Boolean} bCustomTailored Custom Tailored Indicator
     * @param   {Boolean} bIsReadOnly Read Only Indicator
     * @param   {Integer} iRemainingQuantity Remaining Qty
     * @param   {Boolean} bCustomTailorEnabled Custom Tailored Enabled Indicator
     * @param   {Boolean} bCancellationStatus Item Cancellation Status
     * @return {Boolean} value - True/False  - current enabled property of control
     * @public
     */
    getPickUpQuantityEnabled: function(bCustomTailored, bIsReadOnly, iRemainingQuantity, bCustomTailorEnabled,bCancellationStatus) {

      if (bCustomTailored === undefined || bIsReadOnly === undefined || iRemainingQuantity === undefined || bCustomTailorEnabled ===
        undefined || bCancellationStatus === undefined
        || bCustomTailored === null || bIsReadOnly === null || iRemainingQuantity === null || bCustomTailorEnabled === null
        || bCancellationStatus === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bCustomTailored.constructor !== Boolean || bIsReadOnly.constructor !== Boolean || iRemainingQuantity.constructor !== Number ||
        bCustomTailorEnabled.constructor !== Boolean || bCancellationStatus.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return false;
      } else {

      if (bCancellationStatus){
      return false ;}
      else {
        if (bCustomTailored) {

          if (bCustomTailorEnabled) {
            // This is the case when the user is toggling the Custom tailoring button on the UI
            return false;
          } else {
            // The item has been already Custom Tailored and now its an issue/return which is happening
            // so based on remaining quantity - enable or disable the fields
            if (iRemainingQuantity > 0) {
              // If remianing is more than 0 then user can pick/return item
              return true;
            } else {
              return false;
            }

          }
        } else {
          // For Standard Tailoring the normal check based on remaining quantity should happen
          if (iRemainingQuantity > 0) {
            return true;
          } else {
            return false;
          }
        }
        }
      }

    },    
     /**
     * Sets the Enabled state of the Exchange Quantity Column     
     * @param   {Boolean} bCustomTailored Custom Tailored Indicator
     * @param   {Boolean} bIsReadOnly Read Only Indicator
     * @param   {Boolean} bExchangeEnabled Exchange Enabled
     * @param   {Boolean} bCustomTailorEnabled Custom Tailored Enabled Indicator
     * @param   {Boolean} bCancellationStatus Item Cancellation Status
     * @return {Boolean} value - True/False  - current enabled property of control
     * @public
     */
    getExchangeQuantityEnabled: function(bCustomTailored, bIsReadOnly, bExchangeEnabled, bCustomTailorEnabled, bCancellationStatus) {
      if (bCustomTailored === undefined || bIsReadOnly === undefined || bExchangeEnabled === undefined ||
      bCustomTailorEnabled === undefined || bCancellationStatus === undefined ||
        bCustomTailored === null || bIsReadOnly === null || bExchangeEnabled === null || bCustomTailorEnabled === null || bCancellationStatus === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bCustomTailored.constructor !== Boolean || bIsReadOnly.constructor !== Boolean || bExchangeEnabled.constructor !== Boolean ||
        bCustomTailorEnabled.constructor !== Boolean || bCancellationStatus.constructor !== Boolean ) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return false;
      } else {
      if (bCancellationStatus){
      return false ;}
      else {
        if (bCustomTailored) {
          // If item is Custom Tailored - be it on UI or coming from backend
          // disable the Exchange quantity unconditionally
          return false;
        } else {
          // If item is not custom tailored then check the status of Exchange Enabled flag and enable/disable
          // accordingly
          if (bExchangeEnabled) {
            return true;
          } else {
            return false;
          }
        }
      }
      }

    },
     /**
     * Sets the Enabled state of the Alteration Quantity Column     
     * @param   {Boolean} bCustomTailored Custom Tailored Indicator
     * @param   {Boolean} bIsReadOnly Read Only Indicator
     * @param   {Boolean} bAlterationEnabled Alteration Enabled Flag
     * @param   {Boolean} bCustomTailorEnabled Custom Tailored Enabled Indicator
     * @param   {Boolean} bCancellationStatus Item Cancellation Status
     * @return {Boolean} value - True/False  - current enabled property of control
     * @public
     */
    getAlterationQuantityEnabled: function(bCustomTailored, bIsReadOnly, bAlterationEnabled, bCustomTailorEnabled,bCancellationStatus) {

      if (bCustomTailored === undefined || bIsReadOnly === undefined || bAlterationEnabled === undefined || bCustomTailorEnabled ===
        undefined || bCancellationStatus === undefined ||
        bCustomTailored === null || bIsReadOnly === null || bAlterationEnabled === null || bCustomTailorEnabled === null
        || bCancellationStatus === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bCustomTailored.constructor !== Boolean || bIsReadOnly.constructor !== Boolean || bAlterationEnabled.constructor !== Boolean ||
        bCustomTailorEnabled.constructor !== Boolean || bCancellationStatus.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }
      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return false;
      } else {
      if (bCancellationStatus){
       return false;}
      else {
        if (bCustomTailored) {
          // If item is Custom Tailored - be it on UI or coming from backend
          // disable the Alteration quantity and Date unconditionally
          return false;
        } else {
          // If item is not custom tailored then check the status of Alteration Enabled flag and enable/disable
          // accordingly  - Alteration Quantity and Alteration Date
          if (bAlterationEnabled) {
            return true;
          } else {
            return false;
          }
        }
      }
      }
    },
    /**
     * Sets the Enabled state of the Order(Requested) Quantity Column     
     * @param   {Boolean} bIsReadOnly Read Only Indicator     
     * @return {Boolean} value - True/False  - current enabled property of control
     * @public
     */
    getOrderQuantityEnabled: function(bIsReadOnly) {

      if (bIsReadOnly === undefined || bIsReadOnly === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (bIsReadOnly.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bIsReadOnly) {
        // Since Read only is set it takes precendence over all flags
        return false;
      } else {
        return true;
      }
    },
    /**
     * Sets the Enabled state of the Alter Button Enabled     
     * @param   {Boolean} bCanBePicked Can item be picked indicator
     * @return {Boolean} value - True/False  - current enabled property of control
     * @public     
     */
    getAlterButtonEnabled: function(bCanBePicked){


      if ( bCanBePicked === undefined || bCanBePicked === null) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if (  bCanBePicked.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bCanBePicked) {
        return true;
      } else {
        return false;
      }
    },
    /**
     * Sets the Enabled state of the buttons on the Object(Create) Screen   
     * Control the enabled property of 'Save' and 'Submit' buttons
     * on Object Screen
     * @param   {Boolean} bEmployeesSelected Is any employee selected indicator
     * @param   {Boolean} bBusy View Busy Indicator
     * @return {Boolean} value - True/False  - current enabled property of control
     * @public  
     */    
    getObjectActionButtonsEnabled: function(bEmployeesSelected,bBusy){


      if ( bEmployeesSelected === undefined || bBusy === undefined ||  bEmployeesSelected === null || bBusy === null ) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if ( bEmployeesSelected.constructor !== Boolean || bBusy.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bBusy){
      // Page is busy - hence all buttons should be disabled
      return false;
      } else {
      if (bEmployeesSelected){
      // At least one employee is selected
      // Enable the buttons
      return true;
      }else{
      // No employee has been selected
      // Disable the buttons
      return false;
      }
      }

    },
    /**
     * Sets the Enabled state of the Cancel button on the Object(Create) Screen   
     * Control the enabled property of 'Cancel' 
     * on Object Screen
     * @param   {Boolean} bUIDirty Indicator for UI Dirty
     * @param   {Boolean} bBusy View Busy Indicator
     * @return {Boolean} value - True/False  - current enabled property of control
     * @public  
     */         
    getObjectCancelButtonEnabled: function(bUIDirty, bBusy){
      if ( bUIDirty === undefined || bBusy === undefined ||  bUIDirty === null || bBusy === null ) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if ( bUIDirty.constructor !== Boolean || bBusy.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bBusy){
      // Page is busy - hence all buttons should be disabled
      return false;
      } else {
      if (bUIDirty){
      // UI is dirty and some action has been taken by user
      // Enable the button
      return true;
      }else{
      // No Action has been taken by user
      // Disable the buttons
      return false;
      }
      }
    },
    /**
     * Sets the Enabled state of the Submit button on the Process Screen             
     * @param   {Boolean} bSubmitEnable Indicator for Submit Button Enabled Flag
     * @param   {Boolean} bBusy View Busy Indicator
     * @return {Boolean} value - True/False  - current enabled property of control
     * @public  
     */      
    getProcessObjectSubmitEnabled: function(bSubmitEnable, bBusy){

      if ( bSubmitEnable === undefined || bBusy === undefined ||  bSubmitEnable === null || bBusy === null ) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if ( bSubmitEnable.constructor !== Boolean || bBusy.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bBusy){
      // Page is busy - hence all buttons should be disabled
      return false;
      } else {
      if (bSubmitEnable){      
      // Submit should be enabled
      return true;
      }else{
      // Submit should be disabled
      return false;
      }
      }

    },
    /**
     * Sets the Enabled state of the Cancel button on the Process Screen             
     * @param   {Boolean} bUIDirty Indicator for Dirty UI
     * @param   {Boolean} bBusy View Busy Indicator
     * @return {Boolean} value - True/False  - current enabled property of control
     * @public  
     */       
    getProcessObjectCancelEnabled: function(bUIDirty,bBusy){
      if ( bUIDirty === undefined || bBusy === undefined ||  bUIDirty === null || bBusy === null ) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if ( bUIDirty.constructor !== Boolean || bBusy.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bBusy){
      // Page is busy - hence all buttons should be disabled
      return false;
      } else {
      if (bUIDirty){
      // UI is dirty and some action has been taken by user
      // Enable the button
      return true;
      }else{
      // No Action has been taken by user
      // Disable the buttons
      return false;
      }
      }

    },
       /**
     * Sets the Enabled state of the Cancel Request button on the Process Screen             
     * @param   {Boolean} bCancelEnable Indicator for Cancel Enable Button
     * @param   {Boolean} bBusy View Busy Indicator
     * @return {Boolean} value - True/False  - current enabled property of control
     * @public  
     */      
    getProcessObjectCancelRequestEnabled: function(bCancelEnable, bBusy){

            if ( bCancelEnable === undefined || bBusy === undefined ||  bCancelEnable === null || bBusy === null ) {
        jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
        return null;
      }

      if ( bCancelEnable.constructor !== Boolean || bBusy.constructor !== Boolean) {
        jQuery.sap.log.error("Serious Technical Error - Incorrect Data type passed");
        return null;
      }

      if (bBusy){
      // Page is busy - hence all buttons should be disabled
      return false;
      } else {
      if (bCancelEnable){      
      // Cancel Request should be enabled
      return true;
      }else{
      // Cancel Request  should be disabled
      return false;
      }
      }
    }

  };

});
},
	"sap/cdp/ums/managerequests/model/models.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/resource/ResourceModel",
	"sap/cdp/ums/managerequests/utils/config"
], function(JSONModel, Device, ODataModel, ResourceModel, Config) {
	"use strict";

	function extendMetadataUrlParameters(aUrlParametersToAdd, oMetadataUrlParams, sServiceUrl) {
		var oExtensionObject = {},
			oServiceUri = new URI(sServiceUrl);

		aUrlParametersToAdd.forEach(function(sUrlParam) {
			var sLanguage,
				oUrlParameters,
				sParameterValue;

			if (sUrlParam === "sap-language") {
				// for sap-language we check if the launchpad can provide it.
				oMetadataUrlParams["sap-language"] = sap.ushell.Container.getUser().getLanguage();
			} else {
				oUrlParameters = jQuery.sap.getUriParameters();
				sParameterValue = oUrlParameters.get(sUrlParam);
				if (sParameterValue) {
					oMetadataUrlParams[sUrlParam] = sParameterValue;
					oServiceUri.addSearch(sUrlParam, sParameterValue);
				}
			}
		});

		jQuery.extend(oMetadataUrlParams, oExtensionObject);
		return oServiceUri.toString();
	}

	return {
		/**
		 *
		 * @param {object} oOptions a map which contains the following parameter properties
		 * @param {string} oOptions.url see {@link sap.ui.model.odata.v2.ODataModel#constructor.sServiceUrl}.
		 * @param {object} [oOptions.urlParametersForEveryRequest] If the parameter is present in the URL or in case of language the UShell can provide it,
		 * it is added to the odata models metadataUrlParams {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters.metadataUrlParams}, and to the service url.
		 * If you provided a value in the config.metadataUrlParams this value will be overwritten by the value in the url.
		 *
		 * Example: the app is started with the url query, and the user has an us language set in the launchpad:
		 *
		 * ?sap-server=serverValue&sap-host=hostValue
		 *
		 * The createODataModel looks like this.
		 *
		 * models.createODataModel({
		 *     urlParametersToPassOn: [
		 *         "sap-server",
		 *         "sap-language",
		 *         "anotherValue"
		 *     ],
		 *     url : "sap/cdp/ums/managerequests/Url"
		 * });
		 *
		 * then the config will have the following metadataUrlParams:
		 *
		 * metadataUrlParams: {
		 *     // retrieved from the url
		 *     "sap-server" : "serverValue"
		 *     // language is added from the launchpad
		 *     "sap-language" : "us"
		 *     // anotherValue is not present in the url and will not be added
		 * }
		 *
		 * @param {object} [oOptions.config] see {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters} it is the exact same object, the metadataUrlParams are enriched by the oOptions.urlParametersToPassOn
		 * @returns {sap.ui.model.odata.v2.ODataModel}
		 */
		createODataModel: function(oOptions) {
			var aUrlParametersForEveryRequest,
				oConfig,
				sUrl;

			oOptions = oOptions || {};

			if (!oOptions.url) {
				jQuery.sap.log.error("Please provide a url when you want to create an ODataModel",
					"sap/cdp/ums/managerequests.model.models.createODataModel");
				return null;
			}

			// create a copied instance since we modify the config
			oConfig = jQuery.extend(true, {}, oOptions.config);

			aUrlParametersForEveryRequest = oOptions.urlParametersForEveryRequest || [];
			oConfig.metadataUrlParams = oConfig.metadataUrlParams || {};

			sUrl = extendMetadataUrlParameters(aUrlParametersForEveryRequest, oConfig.metadataUrlParams, oOptions.url);

			return this._createODataModel(sUrl, oConfig);
		},

		_createODataModel: function(sUrl, oConfig) {
			//use for non-mockserver requests
			return new ODataModel(sUrl, oConfig);
		},

		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createFLPModel: function() {
			var bIsShareInJamActive = sap.ushell.Container.getUser().isJamActive(),
				oModel = new JSONModel({
					isShareInJamActive: bIsShareInJamActive
				});
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createResourceModel: function(sBundleName) {
			var oResourceModel = new ResourceModel({
				"bundleName": sBundleName
			});
			return oResourceModel;
		},

		createConstantsModel: function() {
			var oConstantsModel = new JSONModel(Config.constants);
			return oConstantsModel;
		},

		createMessageModel: function() {
			var oMessages = sap.ui.getCore()
				.getMessageManager()
				.getMessageModel()
				.getData();
			oMessages.NoOfMessages = oMessages.length;

			var oMessageModel = new JSONModel(oMessages);
			return oMessageModel;
		}

	};

});
},
	"sap/cdp/ums/managerequests/test/integration/AllJourneys.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
jQuery.sap.require("sap.ui.test.opaQunit");
jQuery.sap.require("sap.ui.test.Opa5");

jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.pages.Common");
jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.pages.Worklist");
jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.pages.Object");
jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.pages.NotFound");
jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.pages.Browser");
jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.pages.App");

sap.ui.test.Opa5.extendConfig({
	arrangements: new sap.cdp.ums.managerequests.test.integration.pages.Common(),
	viewNamespace: "sap.cdp.ums.managerequests.view."
});

// Start the tests
jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.WorklistJourney");
jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.ObjectJourney");
jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.NavigationJourney");
jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.NotFoundJourney");
jQuery.sap.require("sap.cdp.ums.managerequests.test.integration.FLPIntegrationJourney");
},
	"sap/cdp/ums/managerequests/test/integration/FLPIntegrationJourney.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([], function() {
	"use strict";

	module("FLP Integration");

	opaTest("Should open the share menu and display the share buttons on the worklist page", function(Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Actions
		When.onTheWorklistPage.iWaitUntilTheTableIsLoaded()
			.and.iPressOnTheShareButton();

		// Assertions
		Then.onTheWorklistPage.and.iShouldSeeTheShareTileButton();
	});

	opaTest("Should open the share menu and display the share buttons", function(Given, When, Then) {
		// Actions
		When.onTheWorklistPage.iRememberTheItemAtPosition(1).
		and.iPressATableItemAtPosition(1).
		and.iWaitUntilTheListIsNotVisible();
		When.onTheObjectPage.iPressOnTheShareButton();

		// Assertions
		Then.onTheObjectPage.
		and.iShouldSeeTheShareTileButton().
		and.theShareTileButtonShouldContainTheRememberedObjectName().
		and.iTeardownMyAppFrame();
	});

});
},
	"sap/cdp/ums/managerequests/test/integration/NavigationJourney.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([], function() {
	"use strict";

	QUnit.module("Navigation");

	opaTest("Should see the objects list", function(Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		//Actions
		When.onTheWorklistPage.iLookAtTheScreen();

		// Assertions
		Then.onTheWorklistPage.iShouldSeeTheTable();
	});

	opaTest("Should react on hashchange", function(Given, When, Then) {
		// Actions
		When.onTheWorklistPage.iRememberTheItemAtPosition(7);
		When.onTheBrowser.iChangeTheHashToTheRememberedItem();

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheRememberedObject().
		and.theViewIsNotBusyAnymore();
	});

	opaTest("Should go back to the TablePage", function(Given, When, Then) {
		// Actions
		When.onTheObjectPage.iPressTheBackButton();

		// Assertions
		Then.onTheWorklistPage.iShouldSeeTheTable();
	});

	opaTest("Object Page shows the correct object Details", function(Given, When, Then) {
		// Actions
		When.onTheWorklistPage.iRememberTheItemAtPosition(1).
		and.iPressATableItemAtPosition(1);

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheRememberedObject();
	});

	opaTest("Should be on the table page again when browser back is pressed", function(Given, When, Then) {
		// Actions
		When.onTheBrowser.iPressOnTheBackwardsButton();

		// Assertions
		Then.onTheWorklistPage.iShouldSeeTheTable();
	});

	opaTest("Should be on the object page again when browser forwards is pressed", function(Given, When, Then) {
		// Actions
		When.onTheBrowser.iPressOnTheForwardsButton();

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheRememberedObject().
		and.iTeardownMyAppFrame();
	});

	opaTest("Should see a busy indication while loading the metadata", function(Given, When, Then) {
		// Arrangements
		Given.iStartMyApp({
			delay: 10000
		});

		//Actions
		When.onTheWorklistPage.iLookAtTheScreen();

		// Assertions
		Then.onTheAppPage.iShouldSeeTheBusyIndicatorForTheWholeApp().
		and.iTeardownMyAppFrame();
	});

	opaTest("Start the App and simulate metadata error: MessageBox should be shown", function(Given, When, Then) {
		//Arrangement
		Given.iStartMyAppOnADesktopToTestErrorHandler("metadataError=true");

		//Assertions
		Then.onTheAppPage.iShouldSeeTheMessageBox("metadataErrorMessageBox").
		and.iTeardownMyAppFrame();

	});

	opaTest("Start the App and simulate bad request error: MessageBox should be shown", function(Given, When, Then) {
		//Arrangement
		Given.iStartMyAppOnADesktopToTestErrorHandler("errorType=serverError");

		//Assertions
		Then.onTheAppPage.iShouldSeeTheMessageBox("serviceErrorMessageBox").
		and.iTeardownMyAppFrame();

	});

});
},
	"sap/cdp/ums/managerequests/test/integration/NotFoundJourney.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([], function() {
	"use strict";

	QUnit.module("NotFound");

	opaTest("Should see the resource not found page when changing to an invalid hash", function(Given, When, Then) {
		//Arrangement
		Given.iStartMyApp();

		//Actions
		When.onTheWorklistPage.iWaitUntilTheTableIsLoaded();
		When.onTheBrowser.iChangeTheHashToSomethingInvalid();

		// Assertions
		Then.onTheNotFoundPage.iShouldSeeResourceNotFound();
	});

	opaTest("Clicking the 'Show my worklist' link on the 'Resource not found' page should bring me back to the worklist", function(Given,
		When, Then) {
		//Actions
		When.onTheAppPage.iWaitUntilTheAppBusyIndicatorIsGone();
		When.onTheNotFoundPage.iPressTheNotFoundShowWorklistLink();

		// Assertions
		Then.onTheWorklistPage.iShouldSeeTheTable();
	});

	opaTest("Clicking the back button should take me back to the not found page", function(Given, When, Then) {
		//Actions
		When.onTheBrowser.iPressOnTheBackwardsButton();

		// Assertions
		Then.onTheNotFoundPage.iShouldSeeResourceNotFound().
		and.iTeardownMyAppFrame();
	});

	opaTest("Should see the 'Object not found' page if an invalid object id has been called", function(Given, When, Then) {
		Given.iStartMyApp({
			hash: "/Requests/SomeInvalidObjectId"
		});

		//Actions
		When.onTheNotFoundPage.iLookAtTheScreen();

		// Assertions
		Then.onTheNotFoundPage.iShouldSeeObjectNotFound();
	});

	opaTest("Clicking the 'Show my worklist' link on the 'Object not found' page should bring me back to the worklist", function(Given, When,
		Then) {
		//Actions
		When.onTheAppPage.iWaitUntilTheAppBusyIndicatorIsGone();
		When.onTheNotFoundPage.iPressTheObjectNotFoundShowWorklistLink();

		// Assertions
		Then.onTheWorklistPage.iShouldSeeTheTable().
		and.iTeardownMyAppFrame();
	});

});
},
	"sap/cdp/ums/managerequests/test/integration/ObjectJourney.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([], function() {
	"use strict";

	QUnit.module("Object");

	opaTest("Should see the busy indicator on object view after metadata is loaded", function(Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		//Actions
		When.onTheWorklistPage.iRememberTheItemAtPosition(1);
		When.onTheBrowser.iRestartTheAppWithTheRememberedItem({
			delay: 1000
		});
		When.onTheAppPage.iWaitUntilTheAppBusyIndicatorIsGone();

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheObjectViewsBusyIndicator().
		and.theObjectViewsBusyIndicatorDelayIsRestored().
		and.iShouldSeeTheRememberedObject().
		and.theObjectViewShouldContainOnlyFormattedUnitNumbers();
	});

	opaTest("Should open the share menu and display the share buttons", function(Given, When, Then) {
		// Actions
		When.onTheObjectPage.iPressOnTheShareButton();

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheShareEmailButton().
		and.iTeardownMyAppFrame();
	});

});
},
	"sap/cdp/ums/managerequests/test/integration/WorklistJourney.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([], function() {
	"use strict";

	module("Worklist");

	opaTest("Should see the table with all entries", function(Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		//Actions
		When.onTheWorklistPage.iLookAtTheScreen();

		// Assertions
		Then.onTheWorklistPage.theTableShouldHaveAllEntries().
		and.theTableShouldContainOnlyFormattedUnitNumbers().
		and.theTitleShouldDisplayTheTotalAmountOfItems();
	});

	opaTest("Should be able to load 10 more items", function(Given, When, Then) {
		//Actions
		When.onTheWorklistPage.iPressOnMoreData();

		// Assertions
		Then.onTheWorklistPage.theTableShouldHaveTheDoubleAmountOfInitialEntries();
	});

	opaTest("Should open the share menu and display the share buttons", function(Given, When, Then) {
		// Actions
		When.onTheWorklistPage.iPressOnTheShareButton();

		// Assertions
		Then.onTheWorklistPage.iShouldSeeTheShareEmailButton().
		and.iTeardownMyAppFrame();
	});

	opaTest("Should see the busy indicator on app view while worklist view metadata is loaded", function(Given, When, Then) {
		// Arrangements
		Given.iStartMyApp({
			delay: 5000
		});

		//Actions
		When.onTheWorklistPage.iLookAtTheScreen();

		// Assertions
		Then.onTheAppPage.iShouldSeeTheBusyIndicatorForTheWholeApp();
	});

	opaTest("Should see the busy indicator on worklist table after metadata is loaded", function(Given, When, Then) {
		//Actions
		When.onTheAppPage.iWaitUntilTheAppBusyIndicatorIsGone();

		// Assertions
		Then.onTheWorklistPage.iShouldSeeTheWorklistTableBusyIndicator().
		and.iTeardownMyAppFrame();
	});

});
},
	"sap/cdp/ums/managerequests/test/integration/pages/App.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/cdp/ums/managerequests/test/integration/pages/Common"
], function(Opa5, PropertyStrictEquals, Common) {
	"use strict";

	Opa5.createPageObjects({
		onTheAppPage: {
			baseClass: Common,

			actions: {

				iWaitUntilTheAppBusyIndicatorIsGone: function() {
					return this.waitFor({
						id: "app",
						viewName: "App",
						// inline-matcher directly as function
						matchers: function(oAppControl) {
							// we set the view busy, so we need to query the parent of the app
							return oAppControl.getParent() && oAppControl.getParent().getBusy() === false;
						},
						errorMessage: "Did not find the App control"
					});
				}
			},

			assertions: {

				iShouldSeeTheBusyIndicatorForTheWholeApp: function() {
					return this.waitFor({
						id: "app",
						viewName: "App",
						matchers: new PropertyStrictEquals({
							name: "busy",
							value: true
						}),
						success: function() {
							// we set the view busy, so we need to query the parent of the app
							QUnit.ok(true, "The rootview is busy");
						},
						errorMessage: "Did not find the App control"
					});
				},

				iShouldSeeTheMessageBox: function(sMessageBoxId) {
					return this.waitFor({
						id: sMessageBoxId,
						success: function() {
							QUnit.ok(true, "The correct MessageBox was shown");
						}
					});
				}
			}

		}

	});

});
},
	"sap/cdp/ums/managerequests/test/integration/pages/Browser.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/cdp/ums/managerequests/test/integration/pages/Common"
], function(Opa5, Common) {
	"use strict";

	Opa5.createPageObjects({
		onTheBrowser: {
			baseClass: Common,

			actions: {

				iPressOnTheBackwardsButton: function() {
					return this.waitFor({
						success: function() {
							// manipulate history directly for testing purposes
							Opa5.getWindow().history.back();
						}
					});
				},

				iPressOnTheForwardsButton: function() {
					return this.waitFor({
						success: function() {
							// manipulate history directly for testing purposes
							Opa5.getWindow().history.forward();
						}
					});
				},

				iChangeTheHashToSomethingInvalid: function() {
					return this.waitFor({
						success: function() {
							Opa5.getHashChanger().setHash("/somethingInvalid");
						}
					});
				},

				iChangeTheHashToTheRememberedItem: function() {
					return this.waitFor({
						success: function() {
							var sObjectId = this.getContext().currentItem.getBindingContext().getProperty("RequestId");
							Opa5.getHashChanger().setHash("/Requests/" + sObjectId);
						}
					});
				},

				iRestartTheAppWithTheRememberedItem: function(oOptions) {
					var sObjectId;
					this.waitFor({
						success: function() {
							sObjectId = this.getContext().currentItem.getBindingContext().getProperty("RequestId");
							this.iTeardownMyAppFrame();
						}
					});

					return this.waitFor({
						success: function() {
							oOptions.hash = "/Requests/" + encodeURIComponent(sObjectId);
							this.iStartMyApp(oOptions);
						}
					});
				}
			},

			assertions: {}
		}

	});
});
},
	"sap/cdp/ums/managerequests/test/integration/pages/Common.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/test/Opa5"
], function(Opa5) {
	"use strict";

	function getFrameUrl(sHash, sUrlParameters) {
		var sUrl = jQuery.sap.getResourcePath("sap/cdp/ums/managerequests/app", ".html");
		sUrlParameters = sUrlParameters ? "?" + sUrlParameters : "";

		if (sHash) {
			sHash = "#ManageRequests-display&/" + (sHash.indexOf("/") === 0 ? sHash.substring(1) : sHash);
		} else {
			sHash = "#ManageRequests-display";
		}

		return sUrl + sUrlParameters + sHash;
	}

	return Opa5.extend("sap.cdp.ums.managerequests.test.integration.pages.Common", {

		iStartMyApp: function(oOptions) {
			var sUrlParameters = "";
			oOptions = oOptions || {};

			if (oOptions.delay) {
				sUrlParameters = "serverDelay=" + oOptions.delay;
			}

			this.iStartMyAppInAFrame(getFrameUrl(oOptions.hash, sUrlParameters));
		},

		iLookAtTheScreen: function() {
			return this;
		},

		iStartMyAppOnADesktopToTestErrorHandler: function(sParam) {
			this.iStartMyAppInAFrame(getFrameUrl("", sParam));
		},

		theUnitNumbersShouldHaveTwoDecimals: function(sControlType, sViewName, sSuccessMsg, sErrMsg) {
			var rTwoDecimalPlaces = /^-?\d+\.\d{2}$/;

			return this.waitFor({
				controlType: sControlType,
				viewName: sViewName,
				success: function(aNumberControls) {
					QUnit.ok(aNumberControls.every(function(oNumberControl) {
							return rTwoDecimalPlaces.test(oNumberControl.getNumber());
						}),
						sSuccessMsg);
				},
				errorMessage: sErrMsg
			});
		}

	});

});
},
	"sap/cdp/ums/managerequests/test/integration/pages/NotFound.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/cdp/ums/managerequests/test/integration/pages/Common"
], function(Opa5, Common) {
	"use strict";

	Opa5.createPageObjects({
		onTheNotFoundPage: {
			baseClass: Common,

			actions: {

				iWaitUntilISeeObjectNotFoundPage: function() {
					return this.waitFor({
						id: "page",
						viewName: "ObjectNotFound",
						success: function(oPage) {
							strictEqual(oPage.getTitle(), oPage.getModel("i18n").getProperty("processObjectTitle"), "the object text is shown as title");
							strictEqual(oPage.getText(), oPage.getModel("i18n").getProperty("noObjectFoundText"), "the object not found text is shown");
						},
						errorMessage: "Did not display the object not found text"
					});
				},

				iWaitUntilISeeResourceNotFoundPage: function() {
					return this.waitFor({
						id: "page",
						viewName: "NotFound",
						success: function(oPage) {
							strictEqual(oPage.getTitle(), oPage.getModel("i18n").getProperty("notFoundTitle"), "the not found title is shown as title");
							strictEqual(oPage.getText(), oPage.getModel("i18n").getProperty("notFoundText"), "the not found text is shown");
						},
						errorMessage: "Did not display the object not found text"
					});
				},

				iPressTheObjectNotFoundShowWorklistLink: function() {
					return this.waitFor({
						id: "link",
						viewName: "ObjectNotFound",
						success: function(oLink) {
							oLink.$().trigger("click");
						},
						errorMessage: "Did not find the link on the not found page"
					});
				},

				iPressTheNotFoundShowWorklistLink: function() {
					return this.waitFor({
						id: "link",
						viewName: "NotFound",
						success: function(oLink) {
							oLink.$().trigger("click");
						},
						errorMessage: "Did not find the link on the not found page"
					});
				}
			},

			assertions: {

				iShouldSeeObjectNotFound: function() {
					return this.waitFor({
						id: "page",
						viewName: "ObjectNotFound",
						success: function(oPage) {
							strictEqual(oPage.getTitle(), oPage.getModel("i18n").getProperty("processObjectTitle"), "the object text is shown as title");
							strictEqual(oPage.getText(), oPage.getModel("i18n").getProperty("noObjectFoundText"), "the object not found text is shown");
						},
						errorMessage: "Did not display the object not found text"
					});
				},

				iShouldSeeResourceNotFound: function() {
					return this.waitFor({
						id: "page",
						viewName: "NotFound",
						success: function(oPage) {
							strictEqual(oPage.getTitle(), oPage.getModel("i18n").getProperty("notFoundTitle"), "the not found title is shown as title");
							strictEqual(oPage.getText(), oPage.getModel("i18n").getProperty("notFoundText"), "the not found text is shown");
						},
						errorMessage: "Did not display the object not found text"
					});
				}

			}

		}

	});

});
},
	"sap/cdp/ums/managerequests/test/integration/pages/Object.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/cdp/ums/managerequests/test/integration/pages/Common",
	"sap/cdp/ums/managerequests/test/integration/pages/shareOptions"
], function(Opa5, PropertyStrictEquals, Common, shareOptions) {
	"use strict";

	var sViewName = "Object";

	Opa5.createPageObjects({
		onTheObjectPage: {
			baseClass: Common,

			actions: jQuery.extend({

				iPressTheBackButton: function() {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						success: function(oPage) {
							oPage.$("navButton").trigger("tap");
						},
						errorMessage: "Did not find the nav button on object page"
					});
				}

			}, shareOptions.createActions(sViewName)),

			assertions: jQuery.extend({

				iShouldSeeTheRememberedObject: function() {
					return this.waitFor({
						success: function() {
							var sBindingPath = this.getContext().currentItem.getBindingContext().getPath();
							return this.waitFor({
								id: "page",
								viewName: sViewName,
								matchers: function(oPage) {
									return oPage.getBindingContext() && oPage.getBindingContext().getPath() === sBindingPath;
								},
								success: function(oPage) {
									QUnit.strictEqual(oPage.getBindingContext().getPath(), sBindingPath, "was on the remembered detail page");
								},
								errorMessage: "Remembered object " + sBindingPath + " is not shown"
							});
						}
					});
				},

				iShouldSeeTheObjectViewsBusyIndicator: function() {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						matchers: function(oPage) {
							return oPage.getBusy();
						},
						success: function(oPage) {
							QUnit.ok(oPage.getBusy(), "The object view is busy");
						},
						errorMessage: "The object view is not busy"
					});
				},

				theViewIsNotBusyAnymore: function() {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						matchers: function(oPage) {
							return !oPage.getBusy();
						},
						success: function(oPage) {
							QUnit.ok(!oPage.getBusy(), "The object view is not busy");
						},
						errorMessage: "The object view is busy"
					});
				},

				theObjectViewsBusyIndicatorDelayIsZero: function() {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						success: function(oPage) {
							strictEqual(oPage.getBusyIndicatorDelay(), 0, "The object view's busy indicator delay is zero.");
						},
						errorMessage: "The object view's busy indicator delay is not zero."
					});
				},

				theObjectViewsBusyIndicatorDelayIsRestored: function() {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						matchers: new PropertyStrictEquals({
							name: "busyIndicatorDelay",
							value: 1000
						}),
						success: function() {
							QUnit.ok(true, "The object view's busy indicator delay default is restored.");
						},
						errorMessage: "The object view's busy indicator delay is still zero."
					});
				},

				theObjectViewShouldContainOnlyFormattedUnitNumbers: function() {
					return this.theUnitNumbersShouldHaveTwoDecimals("sap.m.ObjectHeader",
						sViewName,
						"Object header are properly formatted",
						"Object view has no entries which can be checked for their formatting");
				},

				theShareTileButtonShouldContainTheRememberedObjectName: function() {
					return this.waitFor({
						id: "shareTile",
						viewName: sViewName,
						matchers: function(oButton) {
							var sObjectName = this.getContext().currentItem.getBindingContext().getProperty("Type");
							var sTitle = oButton.getAppData().title;
							return sTitle && sTitle.indexOf(sObjectName) > -1;
						}.bind(this),
						success: function() {
							QUnit.ok(true, "The Save as Tile button contains the object name");
						},
						errorMessage: "The Save as Tile did not contain the object name"
					});
				}

			}, shareOptions.createAssertions(sViewName))

		}

	});

});
},
	"sap/cdp/ums/managerequests/test/integration/pages/Worklist.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/AggregationLengthEquals",
	"sap/ui/test/matchers/AggregationFilled",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/cdp/ums/managerequests/test/integration/pages/Common",
	"sap/cdp/ums/managerequests/test/integration/pages/shareOptions"
], function(Opa5, AggregationLengthEquals, AggregationFilled, PropertyStrictEquals, Common, shareOptions) {
	"use strict";

	var sViewName = "Worklist",
		sTableId = "table";

	function createWaitForItemAtPosition(oOptions) {
		var iPosition = oOptions.position;
		return {
			id: sTableId,
			viewName: sViewName,
			matchers: function(oTable) {
				return oTable.getItems()[iPosition];
			},
			success: oOptions.success,
			errorMessage: "Table in view '" + sViewName + "' does not contain an Item at position '" + iPosition + "'"
		};
	}

	Opa5.createPageObjects({

		onTheWorklistPage: {
			baseClass: Common,
			actions: jQuery.extend({
				iPressATableItemAtPosition: function(iPosition) {
					return this.waitFor(createWaitForItemAtPosition({
						position: iPosition,
						success: function(oTableItem) {
							oTableItem.$().trigger("tap");
						}
					}));
				},

				iRememberTheItemAtPosition: function(iPosition) {
					return this.waitFor(createWaitForItemAtPosition({
						position: iPosition,
						success: function(oTableItem) {
							this.getContext().currentItem = oTableItem;
						}
					}));
				},

				iPressOnMoreData: function() {
					return this.waitFor({
						id: sTableId,
						viewName: sViewName,
						matchers: function(oTable) {
							return !!oTable.$("trigger").length;
						},
						success: function(oTable) {
							oTable.$("trigger").trigger("tap");
						},
						errorMessage: "The Table does not have a trigger"
					});
				},

				iWaitUntilTheTableIsLoaded: function() {
					return this.waitFor({
						id: sTableId,
						viewName: sViewName,
						matchers: [new AggregationFilled({
							name: "items"
						})],
						errorMessage: "The Table has not been loaded"
					});
				},

				iWaitUntilTheListIsNotVisible: function() {
					return this.waitFor({
						id: sTableId,
						viewName: sViewName,
						visible: false,
						matchers: function(oTable) {
							// visible false also returns visible controls so we need an extra check here
							return !oTable.$().is(":visible");
						},
						errorMessage: "The Table is still visible"
					});
				}

			}, shareOptions.createActions(sViewName)),

			assertions: jQuery.extend({

				iShouldSeeTheTable: function() {
					return this.waitFor({
						id: sTableId,
						viewName: sViewName,
						success: function(oTable) {
							QUnit.ok(oTable, "Found the object Table");
						},
						errorMessage: "Can't see the master Table."
					});
				},

				theTableShouldHaveAllEntries: function() {
					return this.waitFor({
						id: sTableId,
						viewName: sViewName,
						matchers: function(oTable) {
							var iThreshold = oTable.getGrowingThreshold();
							return new AggregationLengthEquals({
								name: "items",
								length: iThreshold
							}).isMatching(oTable);
						},
						success: function(oTable) {
							var iGrowingThreshold = oTable.getGrowingThreshold();
							strictEqual(oTable.getItems().length, iGrowingThreshold, "The growing Table has " + iGrowingThreshold + " items");
						},
						errorMessage: "Table does not have all entries."
					});
				},

				theTitleShouldDisplayTheTotalAmountOfItems: function() {
					return this.waitFor({
						id: sTableId,
						viewName: sViewName,
						matchers: new AggregationFilled({
							name: "items"
						}),
						success: function(oTable) {
							var iObjectCount = oTable.getBinding("items").getLength();
							this.waitFor({
								id: "tableHeader",
								viewName: sViewName,
								matchers: function(oPage) {
									var sExpectedText = oPage.getModel("i18n").getResourceBundle().getText("worklistTableTitleCount", [iObjectCount]);
									return new PropertyStrictEquals({
										name: "text",
										value: sExpectedText
									}).isMatching(oPage);
								},
								success: function() {
									QUnit.ok(true, "The Page has a title containing the number " + iObjectCount);
								},
								errorMessage: "The Page's header does not container the number of items " + iObjectCount
							});
						},
						errorMessage: "The table has no items."
					});
				},

				theTableShouldHaveTheDoubleAmountOfInitialEntries: function() {
					var iExpectedNumberOfItems;

					return this.waitFor({
						id: sTableId,
						viewName: sViewName,
						matchers: function(oTable) {
							iExpectedNumberOfItems = oTable.getGrowingThreshold() * 2;
							return new AggregationLengthEquals({
								name: "items",
								length: iExpectedNumberOfItems
							}).isMatching(oTable);
						},
						success: function() {
							QUnit.ok(true, "The growing Table had the double amount: " + iExpectedNumberOfItems + " of entries");
						},
						errorMessage: "Table does not have the double amount of entries."
					});
				},

				theTableShouldContainOnlyFormattedUnitNumbers: function() {
					return this.theUnitNumbersShouldHaveTwoDecimals("sap.m.ObjectNumber",
						sViewName,
						"Object numbers are properly formatted",
						"Table has no entries which can be checked for their formatting");
				},

				iShouldSeeTheWorklistViewsBusyIndicator: function() {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						success: function(oPage) {
							QUnit.ok(oPage.getParent().getBusy(), "The worklist view is busy");
						},
						errorMessage: "The worklist view is not busy"
					});
				},

				iShouldSeeTheWorklistTableBusyIndicator: function() {
					return this.waitFor({
						id: "table",
						viewName: sViewName,
						matchers: function(oTable) {
							return new PropertyStrictEquals({
								name: "busy",
								value: true
							}).isMatching(oTable);
						},
						success: function() {
							QUnit.ok(true, "The worklist table is busy");
						},
						errorMessage: "The worklist table is not busy"
					});
				}

			}, shareOptions.createAssertions(sViewName))

		}

	});

});
},
	"sap/cdp/ums/managerequests/test/integration/pages/shareOptions.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/test/matchers/PropertyStrictEquals"
], function(PropertyStrictEquals) {
	"use strict";

	return {

		createActions: function(sViewName) {
			return {
				iPressOnTheShareButton: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: sViewName,
						matchers: new PropertyStrictEquals({
							name: "icon",
							value: "sap-icon://action"
						}),
						success: function(aButtons) {
							aButtons[0].$().trigger("tap");
						},
						errorMessage: "Did not find the share button"
					});
				}
			};
		},

		createAssertions: function(sViewName) {
			return {

				iShouldSeeTheShareEmailButton: function() {
					return this.waitFor({
						viewName: sViewName,
						controlType: "sap.m.Button",
						matchers: new PropertyStrictEquals({
							name: "icon",
							value: "sap-icon://email"
						}),
						success: function() {
							QUnit.ok(true, "The E-Mail button is visible");
						},
						errorMessage: "The E-Mail button was not found"
					});
				},

				iShouldSeeTheShareTileButton: function() {
					return this.waitFor({
						id: "shareTile",
						viewName: sViewName,
						success: function() {
							QUnit.ok(true, "The Save as Tile button is visible");
						},
						errorMessage: "The Save as Tile  button was not found"
					});
				},

				iShouldSeeTheShareJamButton: function() {
					return this.waitFor({
						id: "shareJam",
						viewName: sViewName,
						success: function() {
							QUnit.ok(true, "The Jam share button is visible");
						},
						errorMessage: "The Jam share button was not found"
					});
				}

			};

		}

	};

});
},
	"sap/cdp/ums/managerequests/test/unit/allTests.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"test/unit/model/formatter",
	"test/unit/model/models",
	"test/unit/controller/App.controller",
	"test/unit/controller/Worklist.controller"
], function() {
	"use strict";
});
},
	"sap/cdp/ums/managerequests/test/unit/controller/App.controller.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/cdp/ums/managerequests/controller/App.controller",
	"sap/ui/core/Control",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function(AppController, Control, Controller, JSONModel) {
	"use strict";

	QUnit.module("Initialization", {

		setup: function() {
			var oViewStub = {
				getModel: function() {
					return this.oViewModel;
				}.bind(this),
				setModel: function(oModel) {
					this.oViewModel = oModel;
				}.bind(this),
				getBusyIndicatorDelay: function() {
					return null;
				},
				addStyleClass: function() {}
			};

			this.oComponentStub = {
				oWhenMetadataIsLoaded: {},
				getContentDensityClass: function() {
					return null;
				}
			};

			sinon.config.useFakeTimers = false;

			sinon.stub(Controller.prototype, "getOwnerComponent").returns(this.oComponentStub);
			sinon.stub(Controller.prototype, "getView").returns(oViewStub);
		},

		teardown: function() {
			Controller.prototype.getOwnerComponent.restore();
			Controller.prototype.getView.restore();

			this.oViewModel.destroy();
		}
	});

	QUnit.test("Should set the control busy without delay", function(assert) {
		// Arrange
		var oModelData,
			oAppController;

		// Do not resolve the thenable
		this.oComponentStub.oWhenMetadataIsLoaded.then = jQuery.noop;

		// Act
		oAppController = new AppController();
		oAppController.onInit();

		oModelData = this.oViewModel.getData();
		// Assert
		assert.strictEqual(oModelData.delay, 0, "The root view has no busy indicator delay set.");
		assert.strictEqual(oModelData.busy, true, "The root view is busy.");
	});

	QUnit.test("Should set the control not busy and reset the delay", function(assert) {
		var oModelData,
			oAppController;

		this.oComponentStub.oWhenMetadataIsLoaded.then = function(fnThenCallback) {
			// invoke the thenable immediately
			fnThenCallback();

			oModelData = this.oViewModel.getData();
			// Assert
			assert.strictEqual(oModelData.delay, null, "The root view has the default busy indicator delay set.");
			assert.strictEqual(oModelData.busy, false, "The root view is not busy.");
		}.bind(this);

		// Act
		oAppController = new AppController();
		oAppController.onInit();
	});

});
},
	"sap/cdp/ums/managerequests/test/unit/controller/Worklist.controller.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/cdp/ums/managerequests/controller/Worklist.controller",
	"sap/cdp/ums/managerequests/controller/BaseController",
	"sap/ui/base/ManagedObject",
	"test/unit/helper/FakeI18nModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function(WorklistController, BaseController, ManagedObject, FakeI18n) {
	"use strict";

	QUnit.module("Table busy indicator delay", {

		setup: function() {
			this.oWorklistController = new WorklistController();
			this.oTableStub = new ManagedObject();
			this.oTableStub.getBusyIndicatorDelay = sinon.stub();
			this.oViewStub = new ManagedObject();
			this.oComponentStub = new ManagedObject();
			this.oComponentStub.setModel(new FakeI18n(), "i18n");

			sinon.stub(this.oWorklistController, "getOwnerComponent").returns(this.oComponentStub);
			sinon.stub(this.oWorklistController, "getView").returns(this.oViewStub);
			sinon.stub(this.oWorklistController, "byId").returns(this.oTableStub);
		},

		teardown: function() {
			this.oWorklistController.destroy();
			this.oTableStub.destroy();
			this.oViewStub.destroy();
			this.oComponentStub.destroy();
		}
	});

	QUnit.test("Should set the initial busyindicator delay to 0", function(assert) {
		// Act
		this.oWorklistController.onInit();

		// Assert
		assert.strictEqual(this.oWorklistController.getModel("worklistView").getData().tableBusyDelay, 0,
			"The original busy delay was restored");
	});

	QUnit.test("Should reset the busy indicator to the original one after the first request completed", function(assert) {
		// Arrange
		var iOriginalBusyDelay = 1;

		this.oTableStub.getBusyIndicatorDelay.returns(iOriginalBusyDelay);

		// Act
		this.oWorklistController.onInit();
		this.oTableStub.fireEvent("updateFinished");

		// Assert
		assert.strictEqual(this.oWorklistController.getModel("worklistView").getData().tableBusyDelay, iOriginalBusyDelay,
			"The original busy delay was restored");
	});

});
},
	"sap/cdp/ums/managerequests/test/unit/helper/FakeI18nModel.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/ui/model/Model"
], function(Model) {
	"use strict";

	return Model.extend("test.unit.helper.FakeI18nModel", {

		constructor: function(mTexts) {
			this.mTexts = mTexts || {};
		},

		getResourceBundle: function() {
			return {
				getText: function(sTextName) {
					return this.mTexts[sTextName];
				}.bind(this)
			};
		}

	});

});
},
	"sap/cdp/ums/managerequests/test/unit/model/formatter.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/cdp/ums/managerequests/model/formatter"
], function(formatter) {
	"use strict";

	QUnit.module("Number unit");

	function numberUnitValueTestCase(assert, sValue, fExpectedNumber) {
		// Act
		var fNumber = formatter.numberUnit(sValue);

		// Assert
		assert.strictEqual(fNumber, fExpectedNumber, "The rounding was correct");
	}

	QUnit.test("Should round down a 3 digit number", function(assert) {
		numberUnitValueTestCase.call(this, assert, "3.123", "3.12");
	});

	QUnit.test("Should round up a 3 digit number", function(assert) {
		numberUnitValueTestCase.call(this, assert, "3.128", "3.13");
	});

	QUnit.test("Should round a negative number", function(assert) {
		numberUnitValueTestCase.call(this, assert, "-3", "-3.00");
	});

	QUnit.test("Should round an empty string", function(assert) {
		numberUnitValueTestCase.call(this, assert, "", "");
	});

	QUnit.test("Should round a zero", function(assert) {
		numberUnitValueTestCase.call(this, assert, "0", "0.00");
	});

});
},
	"sap/cdp/ums/managerequests/test/unit/model/models.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/cdp/ums/managerequests/model/models",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function(models) {
	"use strict";

	QUnit.module("createDeviceModel", {
		teardown: function() {
			this.oDeviceModel.destroy();
		}
	});

	function isPhoneTestCase(assert, bIsPhone) {
		// Arrange
		this.stub(sap.ui.Device, "system", {
			phone: bIsPhone
		});

		// System under test
		this.oDeviceModel = models.createDeviceModel();

		// Assert
		assert.strictEqual(this.oDeviceModel.getData().system.phone, bIsPhone, "IsPhone property is correct");
	}

	QUnit.test("Should initialize a device model for desktop", function(assert) {
		isPhoneTestCase.call(this, assert, false);
	});

	QUnit.test("Should initialize a device model for phone", function(assert) {
		isPhoneTestCase.call(this, assert, true);
	});

	function isTouchTestCase(assert, bIsTouch) {
		// Arrange
		this.stub(sap.ui.Device, "support", {
			touch: bIsTouch
		});

		// System under test
		this.oDeviceModel = models.createDeviceModel();

		// Assert
		assert.strictEqual(this.oDeviceModel.getData().support.touch, bIsTouch, "IsTouch property is correct");
	}

	QUnit.test("Should initialize a device model for non touch devices", function(assert) {
		isTouchTestCase.call(this, assert, false);
	});

	QUnit.test("Should initialize a device model for touch devices", function(assert) {
		isTouchTestCase.call(this, assert, true);
	});

	QUnit.test("The binding mode of the device model should be one way", function(assert) {

		// System under test
		this.oDeviceModel = models.createDeviceModel();

		// Assert
		assert.strictEqual(this.oDeviceModel.getDefaultBindingMode(), "OneWay", "Binding mode is correct");
	});

	QUnit.module("createODataModel", {
		setup: function() {
			this.oODataModel = {};
			this.oDataModelStub = sinon.stub(models, "_createODataModel").returns(this.oODataModel);
		},
		teardown: function() {
			this.oDataModelStub.restore();
		}
	});

	QUnit.test("Should create an ODataModel when only a url is provided", function(assert) {
		// Arrange
		var sUrl = "someUrl",
			oResult;

		// Act
		oResult = models.createODataModel({
			url: sUrl
		});

		// Assert
		assert.strictEqual(oResult, this.oODataModel, "Did return the created instance");
		sinon.assert.calledWith(this.oDataModelStub, sUrl, sinon.match({}));
	});

	QUnit.test("Should create an ODataModel when only a url is provided", function(assert) {
		// Arrange
		var sUrl = "someUrl",
			oResult;

		// Act
		oResult = models.createODataModel({
			url: sUrl
		});

		// Assert
		assert.strictEqual(oResult, this.oODataModel, "Did return the created instance");
		sinon.assert.calledWith(this.oDataModelStub, sUrl, sinon.match({}));
	});

	QUnit.test("Should add url parameters that are present in the url", function(assert) {
		// Arrange
		var sUrl = "someUrl",
			sSapServerParameter = "sap-server",
			sNonExistingValue = "nonExistingValue",
			oExpectedConfig = {
				metadataUrlParams: {
					"sap-server": "someServer"
				}
			},
			getUrlParameterStub = this.stub(),
			sServerValue = oExpectedConfig.metadataUrlParams[sSapServerParameter];

		getUrlParameterStub.withArgs(sSapServerParameter)
			.returns(sServerValue);
		getUrlParameterStub.withArgs(sNonExistingValue)
			.returns(null);

		this.stub(jQuery.sap, "getUriParameters").returns({
			get: getUrlParameterStub
		});

		// Act
		models.createODataModel({
			url: sUrl,
			urlParametersForEveryRequest: [
				"sap-server",
				"nonExistingValue"
			]
		});

		// Assert
		sinon.assert.calledWith(this.oDataModelStub, sUrl + "?" + sSapServerParameter + "=" + sServerValue, sinon.match(oExpectedConfig));
	});

	QUnit.test("Should overwrite existing values when in the url", function(assert) {
		// Arrange
		var sUrl = "someUrl",
			sSapServerParameter = "sap-server",
			oExpectedConfig = {
				metadataUrlParams: {
					"sap-server": "someServer",
					"static": "value"
				}
			},
			sServerValue = oExpectedConfig.metadataUrlParams[sSapServerParameter],
			getUrlParameterStub = this.stub();

		getUrlParameterStub.withArgs(sSapServerParameter)
			.returns(sServerValue);

		this.stub(jQuery.sap, "getUriParameters").returns({
			get: getUrlParameterStub
		});

		// Act
		models.createODataModel({
			url: sUrl,
			urlParametersForEveryRequest: [
				"sap-server"
			],
			config: {
				metadataUrlParams: {
					"sap-server": "anotherServer",
					"static": "value"
				}
			}
		});

		// Assert
		sinon.assert.calledWith(this.oDataModelStub, sUrl + "?" + sSapServerParameter + "=" + sServerValue, sinon.match(oExpectedConfig));
	});

	QUnit.test("Should add sap-language if a user is logged in the shell", function(assert) {
		// Arrange
		var sUrl = "someUrl",
			oExpectedConfig = {
				metadataUrlParams: {
					"sap-language": "us"
				}
			},
			getUrlParameterSpy = this.spy();

		// Stub the language
		sap.ushell = {
			Container: {
				getUser: this.stub().returns({
					getLanguage: this.stub().returns(oExpectedConfig.metadataUrlParams["sap-language"])
				})
			}
		};

		this.stub(jQuery.sap, "getUriParameters").returns({
			get: getUrlParameterSpy
		});

		// Act
		models.createODataModel({
			url: sUrl,
			urlParametersForEveryRequest: [
				"sap-language"
			]
		});

		// Assert
		sinon.assert.calledWith(this.oDataModelStub, sUrl, sinon.match(oExpectedConfig));
		assert.strictEqual(getUrlParameterSpy.callCount, 0, "Did not look in the url");

		// Cleanup
		delete sap.ushell;
	});

	QUnit.module("CreateODataModel - logging");

	QUnit.test("Should log an error if no url is provided", function(assert) {
		// Arrange
		var oErrorStub = this.stub(jQuery.sap.log, "error");

		// Act
		models.createODataModel();

		// Assert
		sinon.assert.calledWith(oErrorStub, sinon.match.string, "sap/cdp/ums/managerequests.model.models.createODataModel");
	});

});
},
	"sap/cdp/ums/managerequests/thirdparty/epadlink.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
], function() {
	"use strict";

	var oEpadUtils= {
		startSign: function () {      	    
		var imgWidth = "50",
		    imgHeight = "50",
		    message = { "firstName": "", "lastName": "", "eMail": "", "location": "",
		 		"imageFormat": 1, "imageX": imgWidth, "imageY": imgHeight, "imageTransparency": false, 
		 		"imageScaling": false, "maxUpScalePercent": 0.0, "rawDataFormat": "ENC", "minSigPoints": 25 },
		 	oDeferred = jQuery.Deferred(),
		 	handleSignResponse;

		 handleSignResponse = function (oEvent) {
		 	document.removeEventListener("SigCaptureWeb_SignResponse", handleSignResponse, false);
	    	var str = oEvent.target.getAttribute("SigCaptureWeb_msgAttri"),
				obj = JSON.parse(str),
		  		oErrorObj= {};

			if (obj.errorMsg != null && obj.errorMsg!="" && obj.errorMsg!="undefined") {
			   oErrorObj.Code = "E";
			   oErrorObj.Message = obj.errorMsg;
               oDeferred.reject(oErrorObj);
            } else {
                if (obj.isSigned) {
					//call backend  
					oDeferred.resolve(obj.imageData);
                }        
            }
		 }.bind(this);

		document.addEventListener('SigCaptureWeb_SignResponse', handleSignResponse, false);
		var messageData = JSON.stringify(message);
		var element = document.createElement("SigCaptureWeb_ExtnDataElem");
		element.setAttribute("SigCaptureWeb_MsgAttribute", messageData);
		document.documentElement.appendChild(element);
		var evt = document.createEvent("Events");
		evt.initEvent("SigCaptureWeb_SignStartEvent", true, false);				
		element.dispatchEvent(evt);
		return oDeferred.promise();
    }
   };
	return oEpadUtils;
});
},
	"sap/cdp/ums/managerequests/utils/Mappings.js":function(){/*
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
},
	"sap/cdp/ums/managerequests/utils/config.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([], function() {
	"use strict";
	var config = {
		constants: {

			"SpecialRequestId": "13",
			"DamageByThirdPartyTypeId": "09",
			"LossByThirdPartyTypeId": "11",
			"LossOnDutyTypeId": "10",
			"DamageOnDutyTypeId": "08",
			"PurchaseRequestId": "07",
			"ReturnTypeId": "14",

			"ForSearch": "For",
			"EmployeeNameSearch": "Name",
			"CreatedOnSearch": "CreatedOn",
			"DurationDays": "30",
			"DraftStuatusId": "IZU01",
			"SentForApproval": "IZU03",

			"EmployeeEntitlementsTypeId": "TypeId",
			"EmployeeEntitlementsSetCodeId": "SetcodeId",
			"EmployeeEntitlementsEventCodeId": "EventCodeId",
			"RequestEmployeesEntitlements": "RequestEmployees/RequestEmployeeEntitlements",
			"PickedUpStatusId": "IZU06",
			"AlteredStatusId": "IZU14",

			"SettingsSortKeyType": "Type",
			"SettingsSortKeyFor": "For",
			"SettingsSortKeyCreatedOn": "CreatedOn",
			"SettingsSortKeyRequester": "Requester",

			"DefaultStatusType": "Status",
			"DefaultStatusTypeValue": "IZU02",
			"ReturnedStatusId": "IZU10",
			"EndOfServiceType": "04",
			"DefaultStatusText": "Ready",

			"CancelledStatusId": "ZCAN",
			"RequestCancelledStatusId" :"IZU08",
			"StatusIdColumn": "StatusId",

			"TypeIdColumn": "TypeId",
			"StoreIdColumn": "PlantId",
			"MillisecondsInDay": 86400000,

			"ReturnCategoryId": "02",
			"IssueCategoryId": "01",

			"SaveAction": "SAVE",
			"SubmitAction": "SUBMIT",
			"UpdateAction": "UPDATE",
			"CancelAction": "CANCEL",
			"Ok": "OK",
			"Cancel": "CANCEL",
			"Dashes": "----",
			"DummyStorageLocationId": "XXXX",
			"ItemUsageUsed" : "01",
			"ItemUsageUnused" : "02",
			"ItemUsageGeneric" : "00"

		},
		variables: {
			"_IsUIDirty": false
		},
		loadedFragments: [],
		loadedMessagPopover: null,
		InvalidUIMap: {}
	};

	return config;
});
},
	"sap/cdp/ums/managerequests/utils/utilFunctions.js":function(){/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define([
	"sap/cdp/ums/managerequests/utils/config",
	"sap/cdp/ums/managerequests/utils/Mappings",
	"sap/m/Panel",
	"sap/m/Dialog",
	"sap/m/MessageBox",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/ui/model/Filter",
	"sap/ui/unified/FileUploaderParameter",
], function(Config, Mappings, Panel, Dialog, MessageBox,
	MessagePopover, MessagePopoverItem, Filter, FileUploaderParameter) {
	"use strict";
	var UtilFunctions = {
		/**
		 * Validates the combobox's value and sets it to empty string, if incorrect
		 * @param  {sap.ui.base.Event} oControlEvent Source of Event
		 * @param  {Boolean} bValMandatory Mandatory Value Indicator
		 */
		validateComboValue: function(oControlEvent, bValMandatory) {
			var oCombo = oControlEvent.getSource();
			// If the event is not sap.ui.base.Event or not provided
			// then exit out of the method
			if (!oControlEvent ||
				!(oControlEvent.getMetadata().getName() === "sap.ui.base.Event")) {
				return null;
			}			
			if (!oCombo.getSelectedItem()) {
				// Set the combobox to empty string in case the value is not from ;
				// the list ;
				oCombo.setValue('');
				if (bValMandatory === true) {
					oCombo.setValueState(sap.ui.core.ValueState.Error);
					oCombo.setValueStateText(this.getView()
						.getModel('i18n')
						.getResourceBundle()
						.getText('cmbError'));
				} else {
					oCombo.setValueState(sap.ui.core.ValueState.Warning);
					oCombo.setValueStateText(this.getView()
						.getModel('i18n')
						.getResourceBundle()
						.getText('cmbWarning'));
				}
			}
		},

		/**
		 * Confirmation Message Utility
		 * @param  {String}   sMessage Message to be displayed
		 * @param  {String}   sTitle Title to be displayed
		 * @param  {Function} callback Function to be called on close of message box
		 */
		showConfirmationDialog: function(sMessage, sTitle, callbackOk) {
			// ..since the 'this' keyword corresponds to the controller
			// and the callback function needs the context of the controller,
			// hence passing it here
			var oControl = this;

			if (!sMessage || !callbackOk) {
				return null;
			}

			MessageBox.confirm(sMessage, {
				title: sTitle,
				onClose: function(sAction) {
					if (sAction === Config.constants.Ok) {
						callbackOk.call(oControl);
					}
				}

			});
		},
		
		/**
		 * Information Message Utility
		 * @param  {String}   sMessage Message to be displayed
		 * @param  {String}   sTitle Title to be displayed
		 * @param  {Function} callback Function to be called on close of message box
		 */
		showInfoDialog: function(sMessage, sTitle, callbackOk) {
			// ..since the 'this' keyword corresponds to the controller
			// and the callback function needs the context of the controller,
			// hence passing it here
			var oControl = this;

			if (!sMessage || !callbackOk) {
				return null;
			}
			
			MessageBox.information(sMessage, {
				title: sTitle,
				onClose: function(sAction) {
					if (sAction === Config.constants.Ok) {
						callbackOk.call(oControl);
					}
				}

			});
		},

		/**
		 * handler for toggle button for toggling the text
		 * @param  {sap.ui.core.Control} oControl [description]
		 * @param  {String} sActiveText   Text for pressed state
		 * @param  {String} sInActiveText Text for unpressed state
		 */
		onToggleButton: function(oControl, sActiveText, sInActiveText) {
			if (!oControl) {
				jQuery.sap.log.error("No toggle button provided");
				return null;
			}
			oControl.setText(oControl.getPressed() ? sActiveText : sInActiveText);
		},
		/**
		 * Compare and Validate Quantity fields
		 * @param {String} sValue Value provided in the input control
		 * @param {String} sLessQuantity Lesser Quantity Value
		 * @param {String} sGreaterQuantity Greater Quantity Value
		 * @return {Object}  Object having Indicator to specify whether the input is valid and type of i18n text to be used
		 */
		validateQuantity: function(sValue, sLessQuantity, sGreaterQuantity) {

			var oStateInformation = {};
			var bValidFloat = false;

			if (sValue === undefined || sLessQuantity === undefined || sGreaterQuantity === undefined 
				|| sValue === null || sLessQuantity === null || sGreaterQuantity === null ) {
				jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
				return null;
			}

			// Check if the passed properties are strings/numbers, if not exit
			if (sValue.constructor !== String || sLessQuantity.constructor !== Number || sGreaterQuantity.constructor !== Number) {
				return null;
			}
			
			oStateInformation.bValid = true;

			// Check for float
			if (parseFloat(sValue,10) && parseFloat(sValue,10) % 1 !== 0) {
				oStateInformation.bValid = false;
				oStateInformation.sValueStateText = "floatQuantityError";
				return oStateInformation;
			}

			// Check for valid positive number
			if (parseInt(sLessQuantity, 10) < 0) {
				oStateInformation.bValid = false;
				oStateInformation.sValueStateText = "quantityErrorText";
				return oStateInformation;
			}
			// Quantity comparison ;
			if (parseInt(sLessQuantity, 10) > parseInt(sGreaterQuantity, 10)) {
				oStateInformation.bValid = false;
				// Then it has to be filled outside this method
				oStateInformation.sValueStateText = "";
			}

			return oStateInformation;
		},
		/**
		 * Set the Value State  for the Input Controls
		 * @param  {Object} oController Reference to the controller
		 * @param  {string} sProperty Property Name
		 * @param  {string} sValueState Value State
		 */
		setValueState: function(oController, sProperty, sValueState) {
			oController._oEditProcessObjectModel.setProperty(sProperty, sValueState);
		},
		/**
		 * Set the Value State Text for the Input Controls
		 * @param  {Object} oController Reference to the controller
		 * @param  {string} sPropertyText Text Name
		 * @param  {string} sValueStateTextId i18n id for Value State Text
		 */
		setValueStateText: function(oController, sPropertyText, sValueStateTextId) {
			oController._oEditProcessObjectModel.setProperty(sPropertyText,
				oController.getResourceBundle().getText(sValueStateTextId));
		},
		/**
		 * Call the mapping function for employee to entitlements
		 * @param  {JSON} oData oRespons to be sanitized
		 * @param {String} sRequestId Request ID in string
		 * @return {Array}  array of the employee with their entitlements
		 */
		mapEmpEntitlements: function(oData, sReqeustId) {
			var aEmployees = [];
			if (!oData) {
				jQuery.sap.log.error("No Data for mapping");
				return null;
			}

			// if RequestId is null then make it empty string;
			sReqeustId = (sReqeustId) ? sReqeustId : "";
			aEmployees = Mappings.mapEmpEntitlements(oData, sReqeustId);
			return aEmployees;
		},

		/**
		 * Call the mapping function for employee to entitlements
		 * @param  {JSON} oData oRespons to be sanitized		 
		 * @return {Array}  array of the employee with their entitlements (in a request)
		 */
		mapDraftRequestEmployees: function(oData) {
			var aEmployees = [];
			if (!oData) {
				jQuery.sap.log.error("No Data for mapping");
				return null;
			}

			aEmployees = Mappings.mapDraftRequestEmployees(oData);
			return aEmployees;
		},

		/**
		 * Call the mapping function for data to 'Request'
		 * @param  {JSON} oData oRespons to be sanitized
		 * @return {Array}  array of the employee with their entitlements
		 */
		mapDataToRequest: function(oData) {
			var oRequest = {};
			if (!oData) {
				jQuery.sap.log.error("No Data for mapping");
				return null;
			}
			oRequest = Mappings.mapDataToRequest(oData);
			return oRequest;
		},
		/**
		 * Shows the popover for particular path and control
		 * @param  {sap.ui.core.Control} oControl [description]
		 * @param  {String} sPath  Path of the error messages
		 */
		showMessgePopover: function(oControl) {
			var oPopover = {};
			if (!oControl) {
				// control not provided hence cannot show MessagePopover
				return null;
			}
			oPopover = this._getMessagePopover();
			oPopover.setModel(sap.ui.getCore()
				.getMessageManager()
				.getMessageModel());
			oPopover.toggle(oControl);
		},

		/**
		 * Dialog box for handling error messages for more then one
		 * objects
		 * @param  {String} sTitle     Title of the
		 * @param  {String} sMessage   [description]
		 * @param  {Array} aData      [description]
		 * @param  {String} actionType [description]
		 */
		showMultiObjDialog: function(sTitle, sMessage, aData, actionType) {
			var sDisplayMessage = "";

			if (!aData.constructor === Array || aData.length <= 0) {
				return null;
			}
			actionType = (actionType) ? actionType : sap.m.MessageBox.Icon.INFORMATION;
		
			aData.forEach(function(record) {
				for (var key in record) {
					sDisplayMessage += "\n\r" + key + ":" + record[key] + "\n\r";
				}
			});
			MessageBox.show(sMessage + " " + sDisplayMessage, {
				title: sTitle
			});
		},
		/**
		 * Parse the OData Message and return
		 * @param {Object} oResponse - Backend Response
		 * @returns {String}
		 */
		parseODataMessage: function(oResponse) {

			var sCompleteMessage = "";
			var oMessage = {};
			// Check
			// 1. Whether the Response data has been provided from backend Or
			// 2. Response Data is of correct data type  Or
			// 3. Sap-Message Prooperty is available
			if (oResponse === undefined || oResponse === null || oResponse.constructor !== Object || !oResponse.headers["sap-message"]) {
				jQuery.sap.log.error('No response is provided from Backend or Data Type is mismatch or Message is not available at header');
				return null;
			}
			sCompleteMessage = oResponse.headers["sap-message"];
			oMessage = JSON.parse(sCompleteMessage);
			return oMessage.message;
		},
		/**
		 * Loads the given fragment and returns it
		 * @param {String} sFragmentName Name of invoked Fragment
		 * @param {Object} oController Controller for invoked Fragment
		 * @returns {sap.core.ui.Fragment} Reference to invoked fragment
		 */
		getFragment: function(sFragmentName, oController) {
			// check if requested fragment is already loaded
			var oFormFragment = Config.loadedFragments[sFragmentName];
			if (oFormFragment) {
				return oFormFragment;
			}

			//if there is the no controller defined, then take the controller
			//of the calling view.

			if (oController) {
				// load the fragment and store a reference for future
				oFormFragment =
					sap.ui.xmlfragment("sap.cdp.ums.managerequests.fragments." + sFragmentName, oController);
			} else {
				// load the fragment and store a reference for future
				// using createId from the calling controller
				oFormFragment =
					sap.ui.xmlfragment(this.createId(sFragmentName),
						"sap.cdp.ums.managerequests.fragments." + sFragmentName, this);
			}

			Config.loadedFragments[sFragmentName] = oFormFragment;
			return Config.loadedFragments[sFragmentName];
		},
		/**
		 * Loads the given fragment and returns it
		 * @param {string} sFragmentName
		 * @param {Object} oController Controller for invoked Fragment
		 * @returns {sap.core.ui.Fragment} Reference to invoked fragment
		 */
		getFreshFragment: function(sFragmentName, oController) {

			//if there is the no controller defined, then take the controller
			//of the calling view.
			var oFormFragment = {};

			if (oController) {
				// load the fragment and store a reference for future
				oFormFragment =
					sap.ui.xmlfragment("sap.cdp.ums.managerequests.fragments." + sFragmentName, oController);
			} else {
				// load the fragment and store a reference for future
				// using createId from the calling controller
				oFormFragment =
					sap.ui.xmlfragment(this.createId(sFragmentName),
						"sap.cdp.ums.managerequests.fragments." + sFragmentName, this);
			}
			return oFormFragment;
		},
		/**
		 * Remove duplicate employees from the new and the existing employees
		 * @param {Array} aValidEmployees Array with Valid Employees
		 * @param {Array} aExistingEmployees Array with Existing Employees
		 * @returns {Array} Array with unique employees
		 */
		removeDuplicateEmployees: function(aValidEmployees, aExistingEmployees) {
			var aUniqueEmployees = [];
			var iNoofExistingEmployees = 0;

			if (!aValidEmployees || (aValidEmployees.constructor !== Array) || aValidEmployees.length <= 0) {
				jQuery.sap.log.error("New Employees not provided");
				return null;
			}
			if (!aExistingEmployees || (aExistingEmployees.constructor !== Array) || aExistingEmployees.length <= 0) {
				jQuery.sap.log.error("Existing Employees not provided");
				return null;
			}
			aUniqueEmployees = aValidEmployees;
			iNoofExistingEmployees = aUniqueEmployees.length;
			aUniqueEmployees = aUniqueEmployees.concat(aExistingEmployees.filter(function(record) {
				for (var i = 0; i < iNoofExistingEmployees; i++) {
					if (aUniqueEmployees[i].EmployeeId === record.EmployeeId) {
						return false;
					}
				}
				return true;
			}));

			return aUniqueEmployees;
		},		
		 /**
		 * Create the Search Filter from chosen values in Search Box
		 * @param {String} sSearchField Search Field		 		 	
		 */
		createSearchFilter: function(sSearchField) {
			var aSearchFilter = [];
			if (!sSearchField) {
				jQuery.sap.log.error("No Search field specified");
				return null;

			}			
			// If Search Key is present create a filter for it also
			if (this._sSearchVal && this._sSearchVal.length > 0) {
				aSearchFilter.push(new Filter(sSearchField,
					sap.ui.model.FilterOperator.Contains, this._sSearchVal));
				this._oSearchFilter = new Filter({
					filters: aSearchFilter,
					bAnd: false
				});
			} else {
				this._oSearchFilter = {};
			}
		},
		/**
		 * Set/Unset UI Dirty State
		 * @param  {Boolean} bValue Dirty State of UI
		 */
		setUIDirty: function(bValue) {
			Config.variables._IsUIDirty = bValue;
		},
		/**
		 * Check whether UI is dirty
		 */
		isUIDirty: function() {
			return Config.variables._IsUIDirty;
		},
		/* 
		************************Internal methods*************************
		*/
		/**
		 * loads the messge popover and returns it
		 * @return {Object} Message popover
		 */
		_getMessagePopover: function() {
			var oMessagePopover = Config.loadedMessagPopover;
			var oMessageTemplate = {};

			if (oMessagePopover) {
				return oMessagePopover;
			}
			oMessageTemplate = new MessagePopoverItem({
				type: '{type}',
				title: '{message}',
				description: '{description}'
			});

			oMessagePopover = new MessagePopover({
				items: {
					path: "/",
					template: oMessageTemplate
				}
			});

			Config.loadedMessagPopover = oMessagePopover;
			return Config.loadedMessagPopover;
		},

		/**
		 * Convert the passed date to GMT timezone
		 * @param  {Date} oDate date to be converted
		 * @return {Date}  retDate  GMT converted Date
		 */
		convertToGMTDate: function(oDate) {
			var TZOffsetMs, tempDate, tempDateGMT, tempDateConverted, retDate;

			if (!oDate) {
				jQuery.sap.log.error('Date not provided!');
				return null;
			}
			//get the time zone offset in minutes
			TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;

			tempDate = new Date(oDate);
			tempDate.setDate(tempDate.getDate());
			tempDateGMT = new Date(tempDate.getFullYear(),
				tempDate.getMonth(),
				tempDate.getDate(), 12, 0, 0, 0);

			tempDateConverted = new Date(tempDateGMT.getTime() + TZOffsetMs);
			retDate = new Date(tempDateConverted.getTime() - TZOffsetMs);

			return retDate;

		},
		/**
		 * Call the common function to set  Value State and Value State Text for controls
		 * @param  {string} sPath         Path of Property in JSON Model
		 * @param  {string} sProperty     Name of Value State Property in JSON Model
		 * @param  {Boolean} bUIValidationState UI Validation State
		 */
		setUIValidationState: function(sPath, sProperty, bUIValidationState) {
			
			var sPickUpValidation = "", sExchangeValidation = "", sAlterationValidation = "" , sOrderValidation = "";
			if (sPath === undefined || sProperty === undefined || bUIValidationState === undefined ||
				sPath === null || sProperty === null || bUIValidationState === null ) {
				jQuery.sap.log.error("Serious Technical Error - Parameters passed are Null or undefined");
				return null;
			}

			// Based on flag and property set the map for UI Valid state
			// Check if the passed properties are strings, if not exit

			if (sPath.constructor !== String || sProperty.constructor !== String) {
				return null;
			}
			// Use 'indexOf' operator to check and match the value passed in the string field sProperty
			// with the particular quantity and populate the Invalid UI Map object suitably
			// Based on flag and property set the map for UI Valid state
			if (sProperty.indexOf("PickUpValueState") !== -1) {
				sPickUpValidation = bUIValidationState ? delete Config.InvalidUIMap[sPath] : Config.InvalidUIMap[sPath] = "PickUpQuantity";
				return null;
			}
			if (sProperty.indexOf("ExchangeValueState") !== -1) {
				sExchangeValidation = bUIValidationState ? delete Config.InvalidUIMap[sPath] : Config.InvalidUIMap[sPath] = "ExchangeQuantity";
				return null;
			}
			if (sProperty.indexOf("AlterationValueState") !== -1) {
				sAlterationValidation = bUIValidationState ? delete Config.InvalidUIMap[sPath] : Config.InvalidUIMap[sPath] =
					"AlterationQuantity";
				return null;
			}
			if (sProperty.indexOf("OrderValueState") !== -1) {
				sOrderValidation = bUIValidationState ? delete Config.InvalidUIMap[sPath] : Config.InvalidUIMap[sPath] =
					"OrderQuantity";
				return null;
			}

		},
		/**
		 * Accumulate the Approvers for  just now selected employees
		 * @param  {Array} aSelectedEmployees 		 
		 * @return {Array}      Array with employees
		 */
		collectNewEmpApprovers: function(aSelectedEmployees) {

			var aApprovers = [ ];
			for (var i = 0 ; i < aSelectedEmployees.length ; i++){
				// Accumulate all the approvers for the chosen employees
				aApprovers.push(aSelectedEmployees[i].Approver);
			}
			return aApprovers;
		},
		/**
		 * Accumulate the Approvers for  already added employees
		 * @param  {Object} oViewController 
		 * @return {Array}      Array with employees
		 */
		collectExistingEmpApprovers: function(oViewController) {
			var aApprovers = [ ];

			// Extract the already added employees for a request (case for 'Draft' as well as when multiple times user clicks on Add button)
			if (Boolean(oViewController.getModel("requestEmployees").getData().RequestEmployees)){
				for (var i = 0 ; i < oViewController.getModel("requestEmployees").getData().RequestEmployees.length ; i++ ) {

					aApprovers.push(oViewController.getModel("requestEmployees").getData().RequestEmployees[i].Approver);	
				}				
			}
			return aApprovers;
		},
		/**
		 * Accumulate the Approvers for  already added employees
		 * @param  {Object}  aApprovers
		 * @return {Boolean}  Whether same or different approvers   
		 */
		checkSameApprovers: function(aApprovers){

			// Check if  Approvers are different for all employees
			var aSortedApprovers = aApprovers.slice().sort();
				for (var k = 0; k < aApprovers.length -1 ; k++) { 
    				if (aSortedApprovers[k + 1] !== aSortedApprovers[k]) {     
     					// Approvers are not same - Show error message and stop processing     					
     				return false;     				     			
					}
				}
				return true;
		},

		/**
		 * Upload the files to backend server
		 * @param  {String} RequestId  Request Id
		 * @param  {String} EmployeeId  Employee Id
		 * @param  {Object} oUploadCollection Upload collection control
		 * @private
		 */
		onStartUpload: function(RequestId, EmployeeId, oUploadCollection) {
			var allUploaded = jQuery.Deferred(),
				filePromises = [];

			// Create custom header for the upload collection
			var oCustomerHeaderSlug = new FileUploaderParameter({
				name: "slug",
				value: RequestId + ", " + EmployeeId
			});

			// Call the function to upload files
			oUploadCollection._aFileUploadersForPendingUpload[0].addHeaderParameter(oCustomerHeaderSlug);
			filePromises = oUploadCollection.upload();

			jQuery.when.apply(this, filePromises)
             		   .done(function () {
                			allUploaded.resolve();                			
             			})
             			.fail(function () {
             				allUploaded.reject();                			
             			});

  			return allUploaded.promise();
		},

		onTriggerWorkflow: function(context, RequestId) {
			var workflowTriggered = jQuery.Deferred(),
		    	oParams = {
				"RequestId": RequestId
			};

		    context.getModel().callFunction("/TriggerWorkflow", {
				"method": "POST",
				"urlParameters": oParams,
				success: function(oData, response) {
					workflowTriggered.resolve();
				}.bind(this),
				error: function(response) {
					workflowTriggered.reject();
				}.bind(this)
			});
			return workflowTriggered.promise();
		}

	};
	
	return UtilFunctions;
});
},
	"sap/cdp/ums/managerequests/view/App.view.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<mvc:View class="sapUiSizeCompact" controllerName="sap.cdp.ums.managerequests.controller.App" displayBlock="true" xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m">\r\n\t<App busy="{appView>/busy}" busyIndicatorDelay="{appView>/delay}" id="app"/>\r\n</mvc:View>',
	"sap/cdp/ums/managerequests/view/NotFound.view.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<mvc:View class="sapUiSizeCompact" controllerName="sap.cdp.ums.managerequests.controller.NotFound" xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m">\r\n\t<MessagePage description="" icon="{sap-icon://document}" id="page" text="{i18n>notFoundText}" title="{i18n>notFoundTitle}">\r\n\t\t<customDescription>\r\n\t\t\t<Link id="link" press="onLinkPressed" text="{i18n>backToWorklist}"/>\r\n\t\t</customDescription>\r\n\t</MessagePage>\r\n</mvc:View>',
	"sap/cdp/ums/managerequests/view/Object.view.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<core:View class="sapUiSizeCompact" controllerName="sap.cdp.ums.managerequests.controller.Object" xmlns:core="sap.ui.core" xmlns:layout="sap.ui.layout" xmlns:customUpload="sap.cdp.ums.managerequests.custom.CustomUploadCollection" xmlns:footerbar="sap.ushell.ui.footerbar" xmlns:semantic="sap.m.semantic" xmlns="sap.m">\r\n  <Page busy="{objectView>/busy}" busyIndicatorDelay="{objectView>/delay}" id="idObjectPage" navButtonPress="onNavBack" showNavButton="true">\r\n    <content>      \r\n      <VBox>\r\n        <Label/>\r\n        <!-- Empty Label for vertical spacing -->\r\n        <OverflowToolbar design="Solid">\r\n          <Select change="onRequestTypeChange" id="idRequestType" items="{path:\'/RequestTypes\', filters: [{ path: \'ExecutionMode\', operator: \'GE\',value1:\'02\' }]}" mode="SingleSelectMaster" selectedKey="{requestEmployees>/TypeId}">\r\n            <core:Item key="{TypeId}" text="{Type}"/>\r\n          </Select>\r\n          <ComboBox change="onEventCodeChange" id="idEventCode" items="{/Events}" placeholder="{i18n>cmbEvntCodePlaceHolder}"\r\n            visible="{objectView>/bSpecialRequest}" selectedKey="{requestEmployees>/EventCodeId}">\r\n            <core:Item key="{EventCodeId}" text="{Code}"/>\r\n          </ComboBox>\r\n          <Select id="idSetCode" items="{/Setcodes}" mode="SingleSelectMaster" \r\n            visible="{= ${requestEmployees>/PositionClassification} ? true : false }" selectedKey="{requestEmployees>/SetcodeId}">\r\n            <core:Item key="{SetcodeId}" text="{SetcodeDescription}"/>\r\n          </Select>\r\n          <ComboBox change="onCostCenterChange" id="idCostCenter" items="{/CostCenters}" placeholder="{i18n>cmbCostCenterPlaceHolder}"\r\n            visible="{objectView>/bSpecialRequest}" selectedKey="{requestEmployees>/CostcenterId}">\r\n            <core:Item key="{CostcenterId}" text="{= ${CostcenterId} +\' - \'+ ${CostcenterDesc}}"/>\r\n          </ComboBox>\r\n          <ComboBox change="onPlantChange" id="idPlant" items="{/Plants}" placeholder="{i18n>cmbPlantPlaceHolder}"\r\n            visible="{objectView>/bSpecialRequest}" selectedKey="{requestEmployees>/PlantId}">\r\n            <core:Item key="{PlantId}" text="{Description}"/>\r\n          </ComboBox>\r\n          <Select change="onVendorChange" id="idVendor" items="{/Vendors}" placeholder="{i18n>cmbPlantPlaceHolder}" visible="{objectView>/bThirdPartyRequest}" selectedKey="{requestEmployees>/Vendor}">\r\n            <core:Item key="{VendorId}" text="{VendorName}"/>\r\n          </Select>\r\n          <ToolbarSpacer/>\r\n          <Button icon="sap-icon://notes" text="{i18n>notes}" type="Transparent" press="onHeaderCommentPress"/>\r\n          <Button icon="{= ${objectView>/bAllExpanded}? \'sap-icon://expand-group\':\'sap-icon://open-command-field\' }" id="idToggleExpand"\r\n            press="onToggleAllExpand" text="{= ${objectView>/bAllExpanded}?${i18n>collapseAll}:${i18n>expandAll}}" type="Transparent"\r\n            visible="{objectView>/bEmployeesSelected}"></Button>\r\n          <Button icon="sap-icon://add" press="onAdd" text="{i18n>addEmployees}" type="Transparent" tooltip="{i18n>addEmployees}"\r\n            enabled="{objectView>/bAddEmployee}"/>\r\n        </OverflowToolbar>\r\n      </VBox>\r\n      <VBox busyIndicatorDelay="{objectView>/delay}" id="idVBoxEntitlements" items="{requestEmployees>/RequestEmployees}">\r\n        <Panel expand="onExpand" class="sapUiResponsiveMargin" expandable="true" width="auto">\r\n          <headerToolbar>\r\n            <Toolbar height="3rem">\r\n              <Title text="{= ${requestEmployees>Name} + \' - \' + ${requestEmployees>EmployeeId} }"/>\r\n              <ToolbarSpacer/>\r\n              <Button icon="sap-icon://delete" press="onDeleteEmployee" text="{i18n>delete}"/>\r\n            </Toolbar>\r\n          </headerToolbar>\r\n          <content>\r\n            <IconTabBar class="sapUiResponsiveContentPadding" expandable="false" id="idIconTabBar" upperCase="true" select="onIconTabBarSelect">\r\n            <items>\r\n            <IconTabFilter icon="sap-icon://list" tooltip="{i18n>reservationItemTooltip}" key="Detail" count="{ItemCount}" text="{i18n>items}" > \r\n            <Table busy="{objectView>/busy}" busyIndicatorDelay="{objectView>/delay}"  \r\n              items="{requestEmployees>RequestEmployeeEntitlements}" noDataText="{i18n>loadingEntitlements}">\r\n              <columns>\r\n                <Column >\r\n                  <header>\r\n                    <Text text="{i18n>entitledItem}"/>\r\n                  </header>\r\n                </Column>\r\n                <Column>\r\n                  <header>\r\n                    <Text text="{i18n>itemSize}"/>\r\n                  </header>\r\n                </Column>\r\n                <Column>\r\n                  <header>\r\n                    <Text text="{i18n>entitledQuantity}"/>\r\n                  </header>\r\n                </Column>\r\n                <Column>\r\n                  <header>\r\n                    <Text text="{i18n>inStockQuantity}"/>\r\n                  </header>\r\n                </Column>\r\n                <Column>\r\n                  <header>\r\n                    <Text text="{i18n>remainingQuantity}"/>\r\n                  </header>\r\n                </Column>\r\n                <Column>\r\n                  <header>\r\n                    <Text text="{= (${requestEmployees>/TypeId} === ${objectView>/sReturnType} )? ${i18n>processObjectReturnedColumnTitle}: ${i18n>ProcessObjectPickUpQtyTableColumnTitle}}"/>\r\n                  </header>\r\n                </Column>\r\n                <Column visible="{objectView>/bPurchaseRequest}">\r\n                  <header>\r\n                    <Text text="{i18n>amountTableColumnTitle}" visible="{objectView>/bPurchaseRequest}"/>\r\n                  </header>\r\n                </Column>\r\n              </columns>\r\n              <ColumnListItem>\r\n                <cells>\r\n                  <ObjectIdentifier title="{requestEmployees>Item}"/>\r\n                  <layout:HorizontalLayout>\r\n                  <Select selectedKey="{requestEmployees>NewItemId}" change="onItemSizeChange" items="{requestEmployees>ItemSizes}" \r\n                    visible="{parts: [{path:\'requestEmployees>IsReadOnly\'}, {path:\'requestEmployees>SizeRelevant\'}] , formatter : \'.formatter.getCreateSizeSelectVisible\'}" tooltip="{requestEmployees>NewItemId}"> \r\n                     <core:Item key="{requestEmployees>ItemId}" text="{requestEmployees>SizeDesc}" tooltip="{requestEmployees>ItemId}"/>\r\n                  </Select>\r\n                  <Text text="{= ${requestEmployees>Size} ? ${requestEmployees>Size} : ${i18n>NotApplicable}}" \r\n                    visible="{parts: [{path:\'requestEmployees>IsReadOnly\'}, {path:\'requestEmployees>SizeRelevant\'}] , formatter : \'.formatter.getCreateSizeTextVisible\'}" tooltip="{= ${requestEmployees>Size} ? ${requestEmployees>NewItemId} : ${i18n>NotApplicable}}"/>\r\n                    </layout:HorizontalLayout>                    \r\n                  <ObjectIdentifier text="{path: \'requestEmployees>EntitledQuantity\'}"/>\r\n                  <ObjectIdentifier text="{path: \'requestEmployees>InstockQuantity\'}"/>\r\n                  <ObjectIdentifier text="{path: \'requestEmployees>RemainingQuantity\'}"/>\r\n                  <Input placeholder="{i18n>quantity}" value="{path:\'requestEmployees>OrderQuantity\' , type: \'sap.ui.model.type.Integer\'}"  type="Number" width="30%"  change="onOrderQuantityChange" valueState="{requestEmployees>OrderValueState}" valueStateText="{requestEmployees>OrderValueStateText}" enabled="{parts: [{path:\'requestEmployees>IsReadOnly\'}] , formatter : \'.formatter.getOrderQuantityEnabled\'}" />\r\n                  <Text text="{= (Math.round(${requestEmployees>OrderQuantity}) > 0) ? (${requestEmployees>OrderQuantity} + \' X \' + ${requestEmployees>Price} + \' = \' + (${requestEmployees>Price} * ${requestEmployees>OrderQuantity}) + \' \' + ${requestEmployees>Currency}) : ${i18n>NotApplicable}}" \r\n                    visible="{objectView>/bPurchaseRequest}"></Text>\r\n                </cells>\r\n              </ColumnListItem>\r\n            </Table>\r\n            </IconTabFilter>\r\n            <IconTabFilter count="{AttachmentCount}" expandable="false" icon="sap-icon://attachment" tooltip="{i18n>attachmentTooltip}" key="Attachment" id="idIcnTabAttachment" text="{i18n>attachments}" >\r\n              <customUpload:CustomUploadCollection />\r\n              <layout:VerticalLayout width="100%" visible="false" id="idAttachedFiles">\r\n                <Table class="sapUiResponsiveMargin" growing="true" growingScrollToLoad="true"\r\n                  noDataText="{i18n>noAttachmentsText}" items="{requestEmployees>/Attachments}" width="auto" >\r\n                  <columns>\r\n                    <Column>\r\n                      <Text text="{i18n>filename}" textAlign="Center" />\r\n                    </Column>\r\n                    <Column>\r\n                      <Text text="{i18n>addedOn}" textAlign="Center" />\r\n                    </Column>\r\n                    <Column>\r\n                      <Text text="{i18n>addedBy}" textAlign="Center" />\r\n                    </Column>\r\n                  </columns>\r\n                  <items>\r\n                    <ColumnListItem type="Active" press="onAttachmentPress">\r\n                      <cells>\r\n                        <Text text="{Name}" />\r\n                        <Text text="{path: \'CreatedOn\', type: \'sap.ui.model.type.Date\', formatOptions: { style : \'long\' }}" />\r\n                        <Text text="{CreatedBy}" />\r\n                      </cells>\r\n                    </ColumnListItem>\r\n                  </items>\r\n                </Table>\r\n              </layout:VerticalLayout>                            \r\n            </IconTabFilter>\r\n            </items>\r\n            </IconTabBar> \r\n          </content>\r\n        </Panel>\r\n      </VBox>\r\n    </content>\r\n    <footer>\r\n      <OverflowToolbar id="footerToolbar">\r\n        <Button icon="sap-icon://alert" press="onMessagePopPress" tooltip="{i18n>messageToolTip}"/>\r\n        <ToolbarSpacer/>\r\n        <Button id="idButtonSave"  enabled= "{parts: [{path:\'objectView>/bEmployeesSelected\'}, {path:\'objectView>/busy\'}] , formatter : \'.formatter.getObjectActionButtonsEnabled\'}"\r\n        icon="sap-icon://save" press="onSave" text="{i18n>save}" tooltip="{i18n>saveTool}"/>\r\n        <Button id="idButtonSubmit"\r\n        enabled= "{parts: [{path:\'objectView>/bEmployeesSelected\'}, {path:\'objectView>/busy\'}] , formatter : \'.formatter.getObjectActionButtonsEnabled\'}" icon="sap-icon://complete" press="onSubmit" text="{i18n>submit}"\r\n          tooltip="{i18n>submitTool}"/>\r\n        <Button enabled="{parts: [{path:\'objectView>/bUIDirty\'}, {path:\'objectView>/busy\'}] , formatter : \'.formatter.getObjectCancelButtonEnabled\'}" icon="sap-icon://undo" press="onCancel" text="{i18n>cancel}" tooltip="{i18n>cancel}" />\r\n      </OverflowToolbar>\r\n    </footer>\r\n  </Page>\r\n</core:View>',
	"sap/cdp/ums/managerequests/view/ObjectNotFound.view.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<mvc:View class="sapUiSizeCompact" controllerName="sap.cdp.ums.managerequests.controller.NotFound" xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m">\r\n\t<MessagePage description="" icon="{sap-icon://product}" id="page" text="{i18n>noObjectFoundText}" title="{i18n>processObjectTitle}">\r\n\t\t<customDescription>\r\n\t\t\t<Link id="link" press="onLinkPressed" text="{i18n>backToWorklist}"/>\r\n\t\t</customDescription>\r\n\t</MessagePage>\r\n</mvc:View>',
	"sap/cdp/ums/managerequests/view/ProcessObject.view.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<mvc:View class="sapUiSizeCompact" controllerName="sap.cdp.ums.managerequests.controller.ProcessObject" xmlns:commons="sap.ui.commons" xmlns:customUpload="sap.cdp.ums.managerequests.custom.CustomUploadCollection"\r\n  xmlns:core="sap.ui.core" xmlns:mvc="sap.ui.core.mvc" xmlns:suite="sap.suite.ui.commons" xmlns="sap.m" xmlns:layout="sap.ui.layout">\r\n  <Page busy="{processObjectView>/busy}" busyIndicatorDelay="{processObjectView>/delay}" id="page" navButtonPress="onNavBack"\r\n    showNavButton="true" title="{i18n>processObjectTitle}">\r\n    <content>\r\n      <ObjectHeader id="idProcessRequestObjectHeader"\r\n        number="{= ( Math.round(${TotalIssuedReturned}) + \'/\' + Math.round(${TotalIssueReturn}) )}"\r\n        numberUnit="{= (${CategoryId} === ${processObjectView>/sReturnCategory} )? ${i18n>processObjectHeaderReturnQty}: ${i18n>processObjectHeaderIssueQty}}"\r\n        responsive="true" title="{= ( ${RequestId} ? ${RequestId} : ${IstyleReference} ) }" tooltip="{= ( ${IstyleReference} ? ${IstyleReference} : \'\') }">\r\n        <statuses>\r\n          <ObjectStatus state="{= ( ${StatusId} === ${processObjectView>/sCancelledStatus} ) ? \'Warning\' : \'Success\' }" text="{Status}"/>\r\n          <ObjectStatus text="{i18n>processObjectCreatedOn}: { path: \'CreatedOn\', type: \'sap.ui.model.type.Date\', formatOptions: { style : \'long\' }}"/>\r\n        </statuses>\r\n        <attributes>\r\n          <ObjectAttribute text="{= ${Category} + \'-\' + ${Type} }"/>\r\n          <ObjectAttribute text="{= ${i18n>processObjectForEmployee} + \': \' + ${For} + \' (\' + Math.round(${ForId}) + \')\'}"/>\r\n          <ObjectAttribute text="{= ${i18n>gender} + \': \' + ${Gender} }"/>\r\n          <ObjectAttribute text="{= ${i18n>position} + \': \' + ${Position} }"/>\r\n          <ObjectAttribute text="{= ${i18n>department} + \': \' + ${Department} }"/>\r\n          <ObjectAttribute text="{= ${i18n>location} + \': \' + ${Location} }"/>\r\n          <ObjectAttribute id="idApprover" text="{i18n>approvers}" active="true" press="onShowApprovers" tooltip="{i18n>approversToolTip}"\r\n            visible="{= ( ${TypeId} === ${processObjectView>/sSpecialRequestId} || ${TypeId} === ${processObjectView>/sDamageByThirdPartyTypeId} || ${TypeId} === ${processObjectView>/sLossByThirdPartyTypeId} ||\r\n            ${TypeId} === ${processObjectView>/sLossOnDutyTypeId} || ${TypeId} === ${processObjectView>/sDamageOnDutyTypeId} ) ? true : false}"/>\r\n        </attributes>\r\n      </ObjectHeader>\r\n      <IconTabBar class="sapUiResponsiveContentPadding" expandable="false" id="idProcessRequestIconTabBar" select="onIconTabBarSelect"\r\n        upperCase="true">\r\n        <items>\r\n          <IconTabFilter icon="sap-icon://list" text="{i18n>items}" tooltip="{i18n>reservationItemTooltip}" count="{ItemCount}" key="Detail" >\r\n            <Table selectionChange="onItemSelected" busyIndicatorDelay="{processObjectView>/tableBusyDelay}" class="sapUiResponsiveMargin" id="idProceessRequestTable"\r\n              items="{processObjectModel>/Request/RequestItems}" noDataText="{i18n>tableNoDataText}" updateFinished="onUpdateFinished" width="auto" mode= "{=  ${processObjectModel>/Request/Editable} ? \'MultiSelect\' : \'None\' }">\r\n              <headerToolbar>\r\n                <OverflowToolbar visible ="{processObjectView>/bOverFlowToolBarVisible}">\r\n                  <ToolbarSpacer/>\r\n                  <Input id="idReceiver" value="{For}" type="Text" placeholder="{i18n>receiver}" showSuggestion="true" showValueHelp="true"\r\n                    valueHelpRequest="handleValueHelp" suggestionItems="{/Employees}" width="20%" valueHelpOnly="true"\r\n                    visible="{= ( ${processObjectModel>/Request/CategoryId} === ${processObjectView>/sReturnCategory} ) ? false:true }">\r\n                    <suggestionItems>\r\n                      <core:Item key="{EmployeeId}" text="{Name}"/>\r\n                    </suggestionItems>\r\n                  </Input>\r\n                  <CheckBox text="{i18n>finalSettlement}" selected="{processObjectModel>/Request/FinalSettlement}"\r\n                    visible="{= ( ( ${processObjectModel>/Request/StatusId} !== ${processObjectView>/sReturnedStatusId} &amp;&amp; ${processObjectModel>/Request/TypeId} === ${processObjectView>/sEndOfServiceType} ) ? true : false ) }"\r\n                    enabled="{= (${processObjectModel>/Request/Editable}) ? true : false }" select="onFinalSettlementSelect"/>\r\n                </OverflowToolbar>\r\n              </headerToolbar>\r\n              <columns>\r\n                <Column id="idProcessObjectItemColumn" mergeDuplicates="true">\r\n                  <Text id="idProcessObjectItemColumnTitle" text="{i18n>ProcessObjectItemTableColumnTitle}" textAlign="Center"/>\r\n                </Column>\r\n                <Column >\r\n                  <Text text="{i18n>processObjectCustomTailoringColumnTitle}" textAlign="Center" width="100%"\r\n                    visible="{= ( ${processObjectModel>/Request/CategoryId} === ${processObjectView>/sReturnCategory} ) ? false:true }"/>\r\n                </Column>\r\n                <Column visible="{= (${processObjectModel>/Request/CategoryId} === ${processObjectView>/sReturnCategory}) ? true:false }">\r\n                  <Text text="{i18n>processObjectUsedColumnTitle}" textAlign="Center"\r\n                    visible="{= ( ${processObjectModel>/Request/CategoryId} === ${processObjectView>/sReturnCategory} ) ? true:false }" width="100%"/>\r\n                </Column>\r\n                <Column id="idProcessObjectSizeColumn">\r\n                  <Text id="idProcessObjectSizeColumnTitle" text="{i18n>ProcessObjectSizeTableColumnTitle}" textAlign="Center" width="100%"/>\r\n                </Column>\r\n                <Column id="idProcessObjectStorageLocationColumn">\r\n                  <Text id="idProcessObjectStorageLocationColumnTitle" text="{i18n>ProcessObjectStorageLocationColumnTitle}" textAlign="Center" width="100%"/>\r\n                </Column>\r\n                <Column id="idProcessObjectInStockQtyColumn">\r\n                  <Text id="idProcessObjectInStockQtyColumnTitle" text="{i18n>ProcessObjectInStockQtyTableColumnTitle}" textAlign="Center" width="100%"/>\r\n                </Column>\r\n                <Column id="idProcessObjectPickedRequestedQtyColumn">\r\n                  <Text id="idProcessObjectPickedRequestedQtyColumnTitle"\r\n                    text="{= (${processObjectModel>/Request/CategoryId} === ${processObjectView>/sReturnCategory} )? ${i18n>processObjectReturnQuantityColumnTitle}: ${i18n>processObjectPickedRequestedColumnTitle}}"\r\n                    textAlign="Center" width="100%"/>\r\n                </Column>\r\n                <Column id="idProcessObjectPickUpQtyColumn">\r\n                  <Text id="idProcessObjectPickUpQtyColumnTitle"\r\n                    text="{= (${processObjectModel>/Request/CategoryId} === ${processObjectView>/sReturnCategory} )? ${i18n>returnQtyTableColumnTitle}: ${i18n>pickUpQtyTableColumnTitle}}"\r\n                    textAlign="Center" width="100%"/>\r\n                </Column>\r\n                <Column id="idProcessObjectExchangeQuantityColumn"\r\n                  visible="{= ( ${processObjectModel>/Request/CategoryId} === ${processObjectView>/sReturnCategory} ) ? false : true }">\r\n                  <Text id="idProcessObjectExchangeQuantityColumnTitle" text="{i18n>ProcessObjectExchangeQuantityTableColumnTitle}" textAlign="Center"\r\n                    width="100%"/>\r\n                </Column>\r\n                <Column id="idProcessObjectAlterationQuantityColumn"\r\n                  visible="{= ( ${processObjectModel>/Request/CategoryId} === ${processObjectView>/sReturnCategory} ) ? false : true }">\r\n                  <Text id="idProcessObjectAlterationQuantityColumnTitle" text="{i18n>processObjectAlterationQuantityTableColumnTitle}" textAlign="Center"\r\n                    width="100%"/>\r\n                </Column>\r\n                <Column id="idProcessObjectPurchaseColumn" visible="{= ( ${TypeId} === ${processObjectView>/sPurchaseRequestTypeId} ) ? true : false }">\r\n                  <Text id="idProcessObjectPurchaseColumnTitle" text="{i18n>amountTableColumnTitle}" textAlign="Center" width="100%"\r\n                    visible="{= ( ${TypeId} === ${processObjectView>/sPurchaseRequestTypeId} ) ? true : false }"/>\r\n                </Column>\r\n              </columns>\r\n              <items>\r\n                <ColumnListItem>\r\n                  <cells>\r\n                    <layout:HorizontalLayout allowWrapping="true">\r\n                      <Button icon="{= ${processObjectModel>ItemText}?\'sap-icon://tag\':\'sap-icon://blank-tag\'}" press="onItemCommentPress" textAlign="Left"\r\n                        tooltip="{i18n>processObjectItemsCommentText}" type="Transparent"/>\r\n                      <Text text="{processObjectModel>Item}" tooltip="{processObjectModel>Item}"/>\r\n                    </layout:HorizontalLayout>\r\n                    <ToggleButton press="onCustTailor" pressed="{processObjectModel>CustomTailored}"\r\n                      text="{= ${processObjectModel>CustomTailored} ? ${i18n>processButCustomTailoring} : ${i18n>processButStandardTailoring} }"\r\n                      enabled="{parts: [{path:\'processObjectModel>CustomTailoredEnabled\'}, {path:\'processObjectModel>IsReadOnly\'}, {path:\'processObjectModel>CancellationStatus\'}] , formatter : \'.formatter.getCustomTailoredButtonEnabled\'}"\r\n                      type="Transparent" visible="{= ( ${processObjectModel>/Request/CategoryId} === ${processObjectView>/sReturnCategory} ) ? false:true }"></ToggleButton>\r\n                    <ToggleButton press="onUsed" text="{= ${processObjectModel>IsUsed} ? ${i18n>processButUsed} : ${i18n>processButUnUsed} }" type="Transparent"\r\n                      pressed="{processObjectModel>IsUsed}"\r\n                      visible="{= ( ${processObjectModel>/Request/CategoryId} === ${processObjectView>/sReturnCategory} ) ? true:false }"\r\n                      enabled="{parts: [{path:\'processObjectModel>IsReadOnly\'}, {path:\'processObjectModel>ConditionEnabled\'}, {path:\'processObjectModel>CancellationStatus\'}] , formatter : \'.formatter.getUsedButtonEnabled\'}"></ToggleButton>\r\n                    <layout:HorizontalLayout>\r\n                      <Select selectedKey="{processObjectModel>NewItemId}" change="onItemSizeChange"\r\n                        visible="{parts: [{path:\'processObjectModel>IsReadOnly\'}, {path:\'processObjectModel>SizeRelevant\'} , {path:\'processObjectModel>CancellationStatus\'}] , formatter : \'.formatter.getSizeSelectVisible\'}"\r\n                        items="{processObjectModel>ItemSizes}" tooltip="{processObjectModel>NewItemId}">\r\n                        <core:Item key="{processObjectModel>ItemId}" text="{processObjectModel>SizeDesc}" tooltip="{processObjectModel>ItemId}"/>\r\n                      </Select>\r\n                      <Text text="{= ${processObjectModel>Size} ? ${processObjectModel>Size} : ${i18n>NotApplicable}}"\r\n                        visible="{parts: [{path:\'processObjectModel>IsReadOnly\'}, {path:\'processObjectModel>SizeRelevant\'}, {path:\'processObjectModel>CancellationStatus\'}] , formatter : \'.formatter.getSizeTextVisible\'}" tooltip="{=${processObjectModel>Size} ? ${processObjectModel>NewItemId} : ${i18n>NotApplicable}}"/>\r\n                    </layout:HorizontalLayout>\r\n                      <layout:HorizontalLayout>\r\n                      <Select change="onStorageLocationChange"\r\n                        visible="{parts: [{path:\'processObjectModel>IsReadOnly\'}, {path:\'processObjectModel>StorageLocationEnabled\'} , {path:\'processObjectModel>CancellationStatus\'} , {path:\'processObjectModel>IsUsed\'}] , formatter : \'.formatter.getUsedStorageLocationSelectVisible\'}"\r\n                        items="{processObjectModel>UsedStorageLocations}" \r\n                        tooltip="{processObjectModel>StorageLocationId}">\r\n                        <core:Item key="{processObjectModel>StorLocId}" text="{processObjectModel>StorLocDesc}" tooltip="{processObjectModel>StorLocId}"/>\r\n                      </Select>\r\n                       <Select change="onStorageLocationChange"\r\n                        visible="{parts: [{path:\'processObjectModel>IsReadOnly\'}, {path:\'processObjectModel>StorageLocationEnabled\'} , {path:\'processObjectModel>CancellationStatus\'} , {path:\'processObjectModel>IsUsed\'}] , formatter : \'.formatter.getUnusedStorageLocationSelectVisible\'}"\r\n                        items="{processObjectModel>UnusedStorageLocations}" \r\n                        tooltip="{processObjectModel>StorageLocationId}">\r\n                        <core:Item key="{processObjectModel>StorLocId}" text="{processObjectModel>StorLocDesc}" tooltip="{processObjectModel>StorLocId}"/>\r\n                      </Select>\r\n                      <Text text="{= ${processObjectModel>StorageLocationDesc} ? ${processObjectModel>StorageLocationDesc} : ${i18n>NotApplicable}}"\r\n                        visible="{parts: [{path:\'processObjectModel>IsReadOnly\'}, {path:\'processObjectModel>StorageLocationEnabled\'}, {path:\'processObjectModel>CancellationStatus\'}] , formatter : \'.formatter.getStorageLocationTextVisible\'}" tooltip="{=${processObjectModel>StorageLocationDesc} ? ${processObjectModel>StorageLocationId} : ${i18n>NotApplicable}}"/>\r\n                    </layout:HorizontalLayout>\r\n                    <Text text="{processObjectModel>InstockQuantity}" class="sapUiResponsiveMargin"></Text>\r\n                    <ProgressIndicator class="sapUiSmallMarginTopBottom"\r\n                      displayValue="{=${processObjectModel>PickedQuantity} + \' \' + ${i18n>processObjectViewOfText} + \' \' + ${processObjectModel>OrderQuantity} }"\r\n                      percentValue="{= (${processObjectModel>PickedQuantity}/${processObjectModel>OrderQuantity} * 100) }" showValue="true" state="Success"\r\n                      width="70%"/>\r\n                    <Input change="onPickUpQuantityChange"\r\n                      enabled="{parts: [{path:\'processObjectModel>CustomTailored\'}, {path:\'processObjectModel>IsReadOnly\'},\r\n                      {path:\'processObjectModel>RemainingQuantity\'},{path:\'processObjectModel>CustomTailoredEnabled\'}, {path:\'processObjectModel>CancellationStatus\'}] , formatter : \'.formatter.getPickUpQuantityEnabled\'}"\r\n                      placeholder="{i18n>quantity}" textAlign="Center"\r\n                      value="{ path : \'processObjectModel>ViewPickupQuantity\' , type: \'sap.ui.model.type.Integer\'}" type="Number"\r\n                      valueState="{processObjectModel>PickUpValueState}" valueStateText="{processObjectModel>PickUpValueStateText}" width="50%"></Input>\r\n                    <Input change="onExchangeQuantityChange" placeholder="{i18n>quantity}" textAlign="Center"\r\n                      value="{ path : \'processObjectModel>ViewExchangeQuantity\' , type: \'sap.ui.model.type.Integer\'}" type="Number"\r\n                      valueState="{processObjectModel>ExchangeValueState}"\r\n                      enabled="{parts: [{path:\'processObjectModel>CustomTailored\'}, {path:\'processObjectModel>IsReadOnly\'},\r\n                      {path:\'processObjectModel>ExchangeEnabled\'},{path:\'processObjectModel>CustomTailoredEnabled\'}, {path:\'processObjectModel>CancellationStatus\'}] , formatter :\'.formatter.getExchangeQuantityEnabled\'}"\r\n                      valueStateText="{processObjectModel>ExchangeValueStateText}" width="50%"></Input>\r\n                    <HBox>\r\n                    <Input change="onAlterationQuantityChange" placeholder="{i18n>quantity}" textAlign="Center"\r\n                      value="{ path : \'processObjectModel>ViewAlterationQuantity\' , type: \'sap.ui.model.type.Integer\' }" type="Number"\r\n                      valueState="{processObjectModel>AlterationValueState}"\r\n                      enabled="{parts: [{path:\'processObjectModel>CustomTailored\'}, {path:\'processObjectModel>IsReadOnly\'},\r\n                      {path:\'processObjectModel>AlterationEnabled\'},{path:\'processObjectModel>CustomTailoredEnabled\'}, {path:\'processObjectModel>CancellationStatus\'}] , formatter :\'.formatter.getAlterationQuantityEnabled\'}"\r\n                      valueStateText="{processObjectModel>AlterationValueStateText}"></Input>                    \r\n                      <Button icon="sap-icon://customer-history" press="onAlterItems" type="Transparent"></Button>\r\n                    </HBox>\r\n                    <Text\r\n                     text="{= (${processObjectModel>Price} * ${processObjectModel>OrderQuantity}) + \' \' + ${processObjectModel>Currency} }"\r\n                      textAlign="Center" width="100%"\r\n                      visible="{= ( ${processObjectModel>/Request/TypeId} === ${processObjectView>/sPurchaseRequestTypeId} ) ? true : false }"></Text>\r\n                  </cells>\r\n                </ColumnListItem>\r\n              </items>\r\n            </Table>\r\n          </IconTabFilter>\r\n          <IconTabFilter expandable="false" icon="sap-icon://notes" key="HeaderComment" text="{i18n>notes}" tooltip="{i18n>reservationTooltip}">\r\n            <TextArea editable="false" rows="5" scrollable="true" value="{HeaderText}" width="70%"/>\r\n            <TextArea rows="5" id="idUserText" placeholder="{i18n>enterComments}" scrollable="true" value="{processObjectModel>/Request/HeaderText}"\r\n              width="70%"/>\r\n          </IconTabFilter>\r\n            <IconTabFilter count="{AttachmentCount}" expandable="false" icon="sap-icon://attachment" tooltip="{i18n>attachmentTooltip}" key="Attachment" id="idIcnTabAttachment" text="{i18n>attachments}" >\r\n              <layout:VerticalLayout width="100%">\r\n                <Table class="sapUiResponsiveMargin" growing="true" growingScrollToLoad="true"\r\n                  noDataText="{i18n>noAttachmentsText}" items="{Attachments}" width="auto" >\r\n                  <columns>\r\n                    <Column>\r\n                      <Text text="{i18n>filename}" textAlign="Center" />\r\n                    </Column>\r\n                    <Column>\r\n                      <Text text="{i18n>addedOn}" textAlign="Center" />\r\n                    </Column>\r\n                    <Column>\r\n                      <Text text="{i18n>addedBy}" textAlign="Center" />\r\n                    </Column>\r\n                  </columns>\r\n                  <items>\r\n                    <ColumnListItem type="Active" press="onAttachmentPress">\r\n                      <cells>\r\n                        <Text text="{Name}" />\r\n                        <Text text="{path: \'CreatedOn\', type: \'sap.ui.model.type.Date\', formatOptions: { style : \'long\' }}" />\r\n                        <Text text="{CreatedBy}" />\r\n                      </cells>\r\n                    </ColumnListItem>\r\n                  </items>\r\n                </Table>\r\n              </layout:VerticalLayout>\r\n            </IconTabFilter>\r\n          <IconTabFilter expandable="false" icon="sap-icon://history" key="Log" text="{i18n>log}" tooltip="{i18n>reservationHistoryTooltip}">\r\n            <List items="{Logs}">\r\n              <FeedListItem info="{MsgType}" sender="{User}" text="{Message}"\r\n                timestamp="{path: \'CreatedOn\', type: \'sap.ui.model.type.Date\', formatOptions: { style : \'long\' }}"/>\r\n            </List>\r\n          </IconTabFilter>\r\n        </items>\r\n      </IconTabBar>\r\n    </content>\r\n    <footer>\r\n      <OverflowToolbar id="footerToolbar">\r\n        <Button icon="sap-icon://alert" press="onMessagePopPress" tooltip="{i18n>messageToolTip}"/>\r\n        <ToolbarSpacer/>\r\n        <Button icon="sap-icon://complete" press="onSubmit" text="{i18n>submit}"         \r\n         enabled= "{parts: [{path:\'processObjectView>/bSubmitEnable\'}, {path:\'processObjectView>/busy\'}] , formatter : \'.formatter.getProcessObjectSubmitEnabled\'}" tooltip="{i18n>submitToolTip}"></Button>        \r\n        <Button id="idSignButton" icon="sap-icon://complete" press="onSignAndSubmit" text="{i18n>sign}" tooltip="{i18n>signTooltip}" enabled= "{parts: [{path:\'processObjectView>/bSubmitEnable\'}, {path:\'processObjectView>/busy\'}] , formatter : \'.formatter.getProcessObjectSubmitEnabled\'}"/>  \r\n        <Button \r\n          icon="sap-icon://undo" press="onRefresh" text="{i18n>cancel}" tooltip="{i18n>cancel}"\r\n          enabled= "{parts: [{path:\'processObjectView>/bUIDirty\'}, {path:\'processObjectView>/busy\'}] , formatter : \'.formatter.getProcessObjectCancelEnabled\'}" ></Button>\r\n        <Button icon="sap-icon://sys-cancel" press="onCancelRequest" text="{i18n>cancelRequest}"          \r\n          enabled= "{parts: [{path:\'processObjectView>/bCancelEnable\'}, {path:\'processObjectView>/busy\'}] , formatter : \'.formatter.getProcessObjectCancelRequestEnabled\'}" \r\n          tooltip="{i18n>cancelToolTip}"></Button>\r\n        <Button id="idPrintButton" icon="sap-icon://print" press="onPressPrint" text="{i18n>print}" tooltip="{i18n>printToolTip}"\r\n          enabled="{= ${processObjectView>/busy} ? false : true }" visible="{processObjectModel>/Request/IsPrintable}"></Button>\r\n      </OverflowToolbar>\r\n    </footer>\r\n  </Page>\r\n</mvc:View>',
	"sap/cdp/ums/managerequests/view/Worklist.view.xml":'<!--\r\n\r\n    Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved\r\n\r\n-->\r\n<mvc:View class="sapUiSizeCompact" controllerName="sap.cdp.ums.managerequests.controller.Worklist" xmlns:footerbar="sap.ushell.ui.footerbar"\r\n\txmlns:mvc="sap.ui.core.mvc" xmlns="sap.m">\r\n\t<Page id="idPage" navButtonPress="onNavBack" showNavButton="true" title="{i18n>worklistViewTitle}">\r\n\t\t<content>\r\n\t\t\t<OverflowToolbar design="Solid">\r\n\t\t\t\t<FacetFilter id="idFacetFilter" reset="onFacetFilterReset" showPersonalization="false" showPopoverOKButton="true" showReset="false"\r\n\t\t\t\t\ttype="Simple">\r\n\t\t\t\t\t<lists>\r\n\t\t\t\t\t\t<FacetFilterList id="idStatusFacetFilterList" items="{/StatusTypes}" listClose="onStatusListClose" multiselect="true"\r\n\t\t\t\t\t\t\ttitle="{i18n>StatusFacetFilterListTitle}">\r\n\t\t\t\t\t\t\t<items >\r\n\t\t\t\t\t\t\t\t<FacetFilterItem key="{StatusId}" text="{Status}"/>\r\n\t\t\t\t\t\t\t</items>\r\n\t\t\t\t\t\t</FacetFilterList>\r\n\t\t\t\t\t\t<FacetFilterList id="idRequestFacetFilterList" items="{/RequestTypes}" listClose="onRequestTypeListClose" multiselect="true"\r\n\t\t\t\t\t\t\ttitle="{i18n>RequestFacetFilterListTitle}">\r\n\t\t\t\t\t\t\t<items >\r\n\t\t\t\t\t\t\t\t<FacetFilterItem key="{TypeId}" text="{Type}"/>\r\n\t\t\t\t\t\t\t</items>\r\n\t\t\t\t\t\t</FacetFilterList>\r\n\t\t\t\t\t\t<FacetFilterList id="idStoreFacetFilterList" items="{/Plants}" listClose="onStoreListClose" multiselect="true"\r\n\t\t\t\t\t\t\ttitle="{i18n>StoreFacetFilterListTitle}">\r\n\t\t\t\t\t\t\t<items >\r\n\t\t\t\t\t\t\t\t<FacetFilterItem key="{PlantId}" text="{Description}"/>\r\n\t\t\t\t\t\t\t</items>\r\n\t\t\t\t\t\t</FacetFilterList>\r\n\t\t\t\t\t</lists>\r\n\t\t\t\t</FacetFilter>\r\n\t\t\t\t<DateRangeSelection change="onDateChange" id="idDateRangeSelection" tooltip="{i18n>DateRangeToolTip}" width="20%"/>\r\n\t\t\t\t<ToolbarSpacer/>\r\n\t\t\t\t<Button icon="sap-icon://undo" press="onFilterReset" text="{i18n>resetFilters}" tooltip="{i18n>resetFiltersToolTip}" type="Transparent"/>\r\n\t\t\t</OverflowToolbar>\r\n\t\t\t<Table busyIndicatorDelay="{worklistView>/tableBusyDelay}" class="sapUiResponsiveMargin" growing="true" growingScrollToLoad="true"\r\n\t\t\t\tid="idTable" items="{ path: \'/Requests\', sorter: { path: \'CreatedOn\', descending: true } }" noDataText="{i18n>tableNoDataText}"\r\n\t\t\t\tupdateFinished="onUpdateFinished" width="auto">\r\n\t\t\t\t<headerToolbar>\r\n\t\t\t\t\t<OverflowToolbar>\r\n\t\t\t\t\t\t<Title id="idTableHeader" text="{worklistView>/worklistTableTitle}"/>\r\n\t\t\t\t\t\t<ToolbarSpacer/>\r\n\t\t\t\t\t\t<SearchField id="idSearch" placeholder="{i18n>SearchFieldText}" search="onSearch" tooltip="{i18n>SearchToolTip}">\r\n\t\t\t\t\t\t\t<layoutData>\r\n\t\t\t\t\t\t\t\t<OverflowToolbarLayoutData maxWidth="300px" minWidth="200px" shrinkable="true"/>\r\n\t\t\t\t\t\t\t</layoutData>\r\n\t\t\t\t\t\t</SearchField>\r\n\t\t\t\t\t\t<OverflowToolbarButton icon="sap-icon://sort" press="onSettingsClick" text="{i18n>SortToolTip}" tooltip="{i18n>SortToolTip}"\r\n\t\t\t\t\t\t\ttype="Transparent"/>\r\n\t\t\t\t\t</OverflowToolbar>\r\n\t\t\t\t</headerToolbar>\r\n\t\t\t\t<columns>\r\n\t\t\t\t\t<Column id="idRequestIdColumn">\r\n\t\t\t\t\t\t<Text id="idRequestIdColumnTitle" text="{i18n>TableRequestIdColumnTitle}"/>\r\n\t\t\t\t\t</Column>\r\n\t\t\t\t\t<Column id="idTypeColumn">\r\n\t\t\t\t\t\t<Text id="idTypeColumnTitle" text="{i18n>TabletypeColumnTitle}"/>\r\n\t\t\t\t\t</Column>\r\n\t\t\t\t\t<Column >\r\n\t\t\t\t\t\t<Text text="{i18n>TableCategoryColumnTitle}"/>\r\n\t\t\t\t\t</Column>\r\n\t\t\t\t\t<Column id="idForEmployeeColumn">\r\n\t\t\t\t\t\t<Text id="idForEmployeeColumnTitle" text="{i18n>TableRequestedForColumnTitle}"/>\r\n\t\t\t\t\t</Column>\r\n\t\t\t\t\t<Column id="idRequesterColumn">\r\n\t\t\t\t\t\t<Text id="idRequesterColumnText" text="{i18n>TableRequesterColumnText}"/>\r\n\t\t\t\t\t</Column>\r\n\t\t\t\t\t<Column id="idCreatedOnColumn">\r\n\t\t\t\t\t\t<Text id="idCreatedOnColumnText" text="{i18n>TableRequestedOnColumnText}"/>\r\n\t\t\t\t\t</Column>\t\t\t\t\t\r\n\t\t\t\t</columns>\r\n\t\t\t\t<items>\r\n\t\t\t\t\t<ColumnListItem press="onPress" type="Navigation">\r\n\t\t\t\t\t\t<cells>\r\n\t\t\t\t\t\t\t<ObjectIdentifier text="{Status}" title="{= ( ${RequestId} ? ${RequestId} : ${IstyleReference} ) }"\r\n\t\t\t\t\t\t\t\ttooltip="{= ( ${IstyleReference} ? ${IstyleReference} : \'\') }"/>\r\n\t\t\t\t\t\t\t<ObjectIdentifier text="{Type}"/>\r\n\t\t\t\t\t\t\t<ObjectIdentifier text="{Category}"/>\r\n\t\t\t\t\t\t\t<ObjectIdentifier text="{= ( Math.round(${ForId}) !== 0 ? Math.round(${ForId}) : ${worklistView>/dashes} )}"                            title="{For}"/>\r\n\t\t\t\t\t\t\t<ObjectIdentifier text="{= ( Math.round(${RequesterId} ) ) }" title="{Requester}"/>\t\t\t\t\t\t\t\r\n\t\t\t\t\t\t\t<Text text="{ path: \'CreatedOn\', type: \'sap.ui.model.type.Date\', formatOptions: { style : \'long\' }}"></Text>\t\r\n\t\t\t\t\t\t</cells>\r\n\t\t\t\t\t</ColumnListItem>\r\n\t\t\t\t</items>\r\n\t\t\t</Table>\r\n\t\t</content>\r\n\t\t<footer>\r\n\t\t\t<OverflowToolbar id="idFooterToolbar">\r\n\t\t\t\t<Button icon="sap-icon://alert" press="onMessagePopPress" tooltip="{i18n>messageToolTip}"/>\r\n\t\t\t\t<ToolbarSpacer/>\r\n\t\t\t\t<Button text="{i18n>newRequest}" icon="sap-icon://create" press="onNew" tooltip="{i18n>newRequestToolTip}"></Button>\r\n\t\t\t</OverflowToolbar>\r\n\t\t</footer>\r\n\t</Page>\r\n</mvc:View>'
}});

/*
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
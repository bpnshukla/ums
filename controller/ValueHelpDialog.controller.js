/*
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
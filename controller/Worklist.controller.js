/*
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
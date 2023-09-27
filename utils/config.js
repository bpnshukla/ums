/*
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
/*
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
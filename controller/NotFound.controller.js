/*
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
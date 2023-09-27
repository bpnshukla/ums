/*
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
/*
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
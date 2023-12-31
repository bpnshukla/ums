/*
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

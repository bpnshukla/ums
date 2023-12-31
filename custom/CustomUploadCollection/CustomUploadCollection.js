/*
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
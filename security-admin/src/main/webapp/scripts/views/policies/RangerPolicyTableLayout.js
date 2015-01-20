/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

 
define(function(require){
    'use strict';

	var Backbone		= require('backbone');
	var XAEnums 		= require('utils/XAEnums');
	var XALinks 		= require('modules/XALinks');
	var XAGlobals 		= require('utils/XAGlobals');
	var SessionMgr 		= require('mgrs/SessionMgr');
	var XAUtil			= require('utils/XAUtils');
	
	var XABackgrid		= require('views/common/XABackgrid');
	var XATableLayout	= require('views/common/XATableLayout');
	var localization	= require('utils/XALangSupport');
	var vFolderInfo = require('views/folders/FolderInfo');
	var RangerServiceDef	= require('models/RangerServiceDef');
	var RangerPolicyTableLayoutTmpl = require('hbs!tmpl/policies/RangerPolicyTableLayout_tmpl');

	require('backgrid-filter');
	require('backgrid-paginator');
	require('bootbox');

	var RangerPolicyTableLayout = Backbone.Marionette.Layout.extend(
	/** @lends RangerPolicyTableLayout */
	{
		_viewName : 'RangerPolicyTableLayout',
		
    	template: RangerPolicyTableLayoutTmpl,

		templateHelpers : function(){
			/*return {
				isSysAdmin 	: this.isSysAdmin,
				assetId 	: this.assetModel.id,
				assetModel 	: this.assetModel,
				version 	: XAGlobals.version
			};*/
			return {
				rangerService:this.rangerService
			};
		},
        
    	breadCrumbs : function(){
    		return [XALinks.get('RepositoryManager'),XALinks.get('ManagePolicies',{model : this.rangerService})];
//    		return [];
   		},        

		/** Layout sub regions */
    	regions: {
			'rTableList'	: 'div[data-id="r_table"]',
		},

    	// /** ui selector cache */
    	ui: {
			'btnDeletePolicy' : '[data-name="deletePolicy"]',
			'btnShowMore' : '[data-id="showMore"]',
			'btnShowLess' : '[data-id="showLess"]',
			'visualSearch' : '.visual_search'
		},

		/** ui events hash */
		events: function() {
			var events = {};
//			events['click ' + this.ui.btnDeletePolicy]  = 'onDelete';
			events['click ' + this.ui.btnShowMore]  = 'onShowMore';
			events['click ' + this.ui.btnShowLess]  = 'onShowLess';
			
			return events;
		},

    	/**
		* intialize a new RangerPolicyTableLayout Layout 
		* @constructs
		*/
		initialize: function(options) {
			console.log("initialized a RangerPolicyTableLayout Layout");

			_.extend(this, _.pick(options,'rangerService'));
			
		/*	this.collection.extraSearchParams = {
//					resourceType : XAEnums.AssetType.ASSET_HDFS.value,
					assetId : this.assetModel.id
			};*/
			this.bindEvents();
			this.initializeServiceDef();
//			this.isSysAdmin = SessionMgr.isSystemAdmin();
		},

		/** all events binding here */
		bindEvents : function(){
			//this.listenTo(this.collection, "remove", this.render, this);
			/*this.listenTo(this.model, "change:foo", this.modelChanged, this);*/
			/*this.listenTo(communicator.vent,'someView:someEvent', this.someEventHandler, this)'*/
			//this.listenTo(this.collection, "sync", this.render, this);
			//
		},
		initializeServiceDef : function(){
			this.rangerServiceDefModel	= new RangerServiceDef();
			this.rangerServiceDefModel.url = "service/plugins/definitions/name/"+this.rangerService.get('type');
			this.rangerServiceDefModel.fetch({
				cache : false,
				async : false
			})
		},
		/** on render callback */
		onRender: function() {
//			this.initializePlugins();
//			this.addVisualSearch();
			this.renderTable();
			//TODO REMOVE
			this.rTableList.$el.find('th[class="renderable table"]').removeClass('table')
			
//			XAUtil.highlightDisabledPolicy(this);
		},

		/** all post render plugin initialization */
		initializePlugins: function(){
		},
		renderTable : function(){
			var that = this;
			this.rTableList.show(new XATableLayout({
				columns: this.getColumns(),
				collection: this.collection,
				includeFilter : false,
				gridOpts : {
//					row: TableRow,
					header : XABackgrid,
					emptyText : 'No Policies found!'
				},
			}));
		},

		getColumns : function(){
			var that = this;
			var cols = {
				name : {
					cell : "uri",
					href: function(model){
						return '#!/service/'+that.rangerService.id+'/policies/'+model.id+'/edit';
					},
					label	: localization.tt("lbl.policyName"),
					editable: false,
					sortable : false
				},	
				isEnabled:{
					label:localization.tt('lbl.status'),
					cell :"html",
					editable:false,
					formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
						fromRaw: function (rawValue) {
							return rawValue ? '<label class="label label-success">Enabled</label>' : '<label class="label label-important">Disabled</label>';
						}
					}),
					click : false,
					drag : false,
					sortable : false
				},
				isAuditEnabled:{
					label:localization.tt('lbl.auditLogging'),
					cell :"html",
					editable:false,
					formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
						fromRaw: function (rawValue) {
							return rawValue ? '<label class="label label-success">Enabled</label>' : '<label class="label label-important">Disabled</label>';
						}
					}),
					click : false,
					drag : false,
					sortable : false
				},
			};
			_.each(this.rangerServiceDefModel.get('resources'), function(obj){
				if(!_.isUndefined(obj) && !_.isNull(obj))
					 cols[obj.name]={
							cell : "html",
							label	: XAUtil.capitaliseFirstLetter(obj.name),
							editable: false,
							sortable : false,
							formatter: _.extend({}, Backgrid.CellFormatter.prototype, {
								fromRaw: function (rawValue,model) {
									rawValue = model.get('resources')
									return _.isUndefined(rawValue[obj.name]) ? '--' : rawValue[obj.name].values.toString();
								}
							})
						};

			});
			return this.collection.constructor.getTableCols(cols, this.collection);
		},
		onDelete :function(e){
			var that = this;
			var VXResource = require('models/VXResource');
			var obj = this.collection.get($(e.currentTarget).data('id'));
			var model = new VXResource(obj.attributes);
			model.collection = this.collection;
			XAUtil.confirmPopup({
				//msg :localize.tt('msg.confirmDelete'),
				msg :'Are you sure want to delete ?',
				callback : function(){
					XAUtil.blockUI();
					model.destroy({
						success: function(model, response) {
							XAUtil.blockUI('unblock');
							that.collection.remove(model.get('id'));
							$(that.rFolderInfo.el).hide();
							XAUtil.notifySuccess('Success', localization.tt('msg.policyDeleteMsg'));
							if(that.collection.length ==  0){
								that.renderTable();
								that.collection.fetch();
							}
						},
						error: function (model, response, options) {
							XAUtil.blockUI('unblock');
							if ( response && response.responseJSON && response.responseJSON.msgDesc){
								    XAUtil.notifyError('Error', response.responseJSON.msgDesc);
							    }else
							    	XAUtil.notifyError('Error', 'Error deleting Policy!');
							    console.log("error");
						}
					});
				}
			});
		},
		onShowMore : function(e){
			var id = $(e.currentTarget).attr('policy-group-id');
			this.rTableList.$el.find('[policy-group-id="'+id+'"]').show();
			$('[data-id="showLess"][policy-group-id="'+id+'"]').show();
			$('[data-id="showMore"][policy-group-id="'+id+'"]').hide();
		},
		onShowLess : function(e){
			var id = $(e.currentTarget).attr('policy-group-id');
			this.rTableList.$el.find('[policy-group-id="'+id+'"]').slice(4).hide();
			$('[data-id="showLess"][policy-group-id="'+id+'"]').hide();
			$('[data-id="showMore"][policy-group-id="'+id+'"]').show();
		},
		addVisualSearch : function(){
			var that = this;
			var searchOpt = ['Resource Path','Group','Policy Name'];//,'Start Date','End Date','Today'];
			var serverAttrName  = [{text : "Resource Path", label :"name"}, {text : "Group", label :"groupName"},
								   {text : "Policy Name", label :"policyName"}];
			                     // {text : 'Start Date',label :'startDate'},{text : 'End Date',label :'endDate'},
				                 //  {text : 'Today',label :'today'}];
									
			var pluginAttr = {
				      placeholder :localization.tt('h.searchForPolicy'),
				      container : this.ui.visualSearch,
				      query     : '',
				      callbacks :  { 
				    	  valueMatches :function(facet, searchTerm, callback) {
								switch (facet) {
									case 'Result':
										callback(XAUtil.enumToSelectLabelValuePairs(XAEnums.AuthStatus));
										break;
									case 'Login Type':
										callback(XAUtil.enumToSelectLabelValuePairs(XAEnums.AuthType));
										break;	
									/*case 'Start Date' :
										setTimeout(function () { XAUtil.displayDatepicker(that.ui.visualSearch, callback); }, 0);
										break;
									case 'End Date' :
										setTimeout(function () { XAUtil.displayDatepicker(that.ui.visualSearch, callback); }, 0);
										break;
									case 'Today'	:
										var today = Globalize.format(new Date(),"yyyy/mm/dd");
										callback([today]);
										break;*/
								}     
			            	
							}
				      }
				};
			window.vs = XAUtil.addVisualSearch(searchOpt,serverAttrName, this.collection,pluginAttr);
		},
		/** on close */
		onClose: function(){
		}

	});

	return RangerPolicyTableLayout; 
});

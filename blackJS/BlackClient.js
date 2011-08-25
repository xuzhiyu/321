/**
 * @author jinlan
 * 2011-7-25
 */
define("blackJS/BlackClient", ['dojo',"dojox.rpc.JsonRPC",'blackJS.BlackJS'], function(dojo,jsonrpc,BlackJS) {

	var BlackClient=dojo.declare(null, new (function(){
		
		var TRANSPORT='POST';
		var ENVELOPE='JSON-RPC-2.0';
		
		var NULL_ARGUMENT_EXCEPTION=BlackJS.NULL_ARGUMENT_EXCEPTION;
		
		this._service;
		this._url; 
		
		this.constructor=function(url){
			if(url==null){
				throw NULL_ARGUMENT_EXCEPTION;
			}
			var smd=_createSMDObject(url);
			var service=new dojox.rpc.Service(smd);
			this._service=service;
			this._url=url;
		};
		this.getServiceList=function(){
			return this._service.getServiceList();
		};
		this.getServiceClient=function(serviceName){
			if(serviceName==null){
				throw NULL_ARGUMENT_EXCEPTION;
			}
			return new _ServiceClient(this,serviceName);
		};
		this.call=function(serviceName,methodName,params){
			if(serviceName==null || methodName==null){
				throw NULL_ARUGMENT_EXCEPTION;
			}
			var deferred=new dojo.Deferred();
			this._service.call(serviceName,methodName,params).then(function(response,ioargs){
				_unpackBlackResponseObject.call(null,response,deferred);
			},function(error){
				deferred.reject(error);
			});
			return deferred;
		};
		this.notify=function(serviceName,methodName,params){
			var request=_createNotifyRequest.call(this,serviceName,methodName,params);
			return _sendRequest.call(this,request);
		};
		this.createBatch=function(){
			return new _BatchOperation(this);
		};
		
		var _unpackBlackResponseObject=function(responseObject,deferred){
			if(_BlackResponse.validateResponseObject(responseObject)==false){
				deferred.reject(_BlackResponse.INVALID_BLACK_RESPONSE);
				return;
			}
			var blackResponse=new _BlackResponse(responseObject);
			if(blackResponse.isSuccess()==false){
				deferred.reject(new Error(blackResponse.getErrorMessage()));
				return;
			}
			deferred.resolve(blackResponse.getData());
		};
		var _getID=function(){
			var service=this._service;
			return service._requestId;
		};
		var _createRequest=function(serviceName,methodName,params){
			if(serviceName==null || methodName==null){
				throw NULL_ARUGMENT_EXCEPTION;
			}
			var service=this._service;
			var smd=service._smd;
			var args=[];
			for(var n in arguments){
				args[n]=arguments[n];
			}
			var request=service._getRequest(smd.services['call'],args);
			return request;
		};
		var _sendRequest=function(request){
			var service=this._service;
			var deferred = dojox.rpc.transportRegistry.match(request.transport).fire(request);
			deferred.addBoth(function(results){
				return request._envDef.deserialize.call(service,results);
			});
			return deferred;
		};
		var _createNotifyRequest=function(serviceName,methodName,params){
			var request=_createRequest.call(this,serviceName,methodName,params);
			var requestData=dojo.fromJson(request.data);
			delete requestData.id;
			request.data=dojo.toJson(requestData);
			return request;
		};
		
		var _createSMDObject=function(url){
			var smd={};
			smd.SMDVersion='2.0';
			smd.envelope=ENVELOPE;
			smd.transport=TRANSPORT;
			smd.target=url;
			smd.services={};
			smd.services.getServiceList={};
			smd.services.getServiceList.SMDVersion='2.0';
			smd.services.call={};
			smd.services.call.SMDVersion='2.0';
			smd.services.call.parameters=[];
			smd.services.call.parameters.push({'optional':false});
			smd.services.call.parameters.push({'optional':false});
			smd.services.call.parameters.push({'optional':true});
			return smd;
		};
		var _ServiceClient=dojo.declare(null, new (function(){
			
			this._client;
			this._serviceName;
			
			this.constructor=function(client,serviceName){
				this._client=client;
				this._serviceName=serviceName;
			};
			this.call=function(method,params){
				if(method==null){
					throw NULL_ARGUMENT_EXCEPTION;
				}
				return this._client.call(this._serviceName,method,params);
			};
			this.notify=function(method,params){
				if(method==null){
					throw NULL_ARGUMENT_EXCEPTION;
				}
				return this._client.notify(this._serviceName,method,params); 
			};
			
		})());
		var _JSONRPC2Response=dojo.declare(null, new (function(){
			
			this._responseObject;
			
			this.constructor=function(responseObject){
				this._responseObject=responseObject;
			};
			this.getID=function(){
				return this._responseObject.id;
			};
			this.isError=function(){
				return this._responseObject.error!=null;
			};
			this.getErrorMessage=function(){
				var error=this._responseObject.error;
				if(dojo.isObject(error)==true){
					return error.message;
				}
			};
			this.getResult=function(){
				return this._responseObject.result;
			};
			
		})());
		_JSONRPC2Response.INVALID_JSONRPC2_RESPONSE=new Error('invalid JSON-RPC 2.0 response');
		_JSONRPC2Response.validateResponseObject=function(responseObject){
			if(dojo.isObject(responseObject)==false){
				return false;
			}
			if(responseObject.jsonrpc!='2.0'){
				return false;
			}
			if(responseObject.id===undefined){
				return false;
			}
			if(responseObject.result===undefined && responseObject.error===undefined){
				return false;
			}
			return true;
		};
		
		var _BlackResponse=dojo.declare(null, new (function(){
			
			this._responseObject;
			
			this.constructor=function(responseObject){
				this._responseObject=responseObject;
			};
			this.isSuccess=function(){
				return this._responseObject.meta.success;
			};
			this.getErrorMessage=function(){
				return this._responseObject.meta.errorMessage;
			};
			this.getData=function(){
				return this._responseObject.data;
			};
			
		})());
		_BlackResponse.INVALID_BLACK_RESPONSE=new Error('invalid black response');
		_BlackResponse.validateResponseObject=function(response){
			if(dojo.isObject(response)==false || response.meta==null || dojo.isObject(response.meta)==false || response.meta.success==null){
				return false;
			}
			return true;
		};
		
		var _BatchOperation=dojo.declare( null, new (function(){
			
			var NULL_ARGUMENT_EXCEPTION=BlackJS.NULL_ARGUMENT_EXCEPTION;
			
			this._client;
			this._requests;
			this._handlers;
			
			this.constructor=function(client){
				if(client==null){
					throw NULL_ARGUMENT_EXCEPTION;
				}
				var requests=[];
				var handlers={};
				this._client=client;
				this._requests=requests;
				this._handlers=handlers;
			};
			this.getServiceClient=function(serviceName){
				if(serviceName==null){
					throw NULL_ARUGMENT_EXCEPTION;
				}
				return new _ServiceClient(this,serviceName);
			};
			this.call=function(serviceName,methodName,params){
				if(serviceName==null || methodName==null){
					throw NULL_ARGUMENT_EXCEPTION;
				}
				var client=this._client;
				var requests=this._requests;
				var handlers=this._handlers;
				var id=_getID.call(client);
				var request=_createRequest.call(client,serviceName,methodName,params);
				requests.push(request);
				var handler=new dojo.Deferred();
				handlers[id]=handler;
				return handler;
			};
			this.notify=function(serviceName,methodName,params){
				if(serviceName==null || methodName==null){
					throw NULL_ARGUMENT_EXCEPTION;
				}
				var client=this._client;
				var requests=this._requests;
				var request=_createNotifyRequest.call(client,serviceName,methodName,params);
				requests.push(request);
			};
			this.commit=function(){
				var requests=this._requests;
				var client=this._client;
				var handlers=this._handlers;
				var request=_createRequest.call(client,'','');
				var datas=[];
				for(var n in requests){
					datas.push(requests[n].data);
				}
				var data='['+datas.join(',')+']';
				request.data=data;
				var deferred=_sendRequest.call(client,request);
				deferred.then(function(responses,ioarg){
					if(dojo.isArray(responses)==true){
						for(var n in responses){
							var response=responses[n];
							if(_JSONRPC2Response.validateResponseObject(response)==true){
								var JSONRPC2Response=new _JSONRPC2Response(response);
								var id=JSONRPC2Response.getID();
								if(id!=null){
									var handler=handlers[id];
									if(handlers!=null){
										if(JSONRPC2Response.isError()==true){
											handler.reject(new Error(JSONRPC2Response.getErrorMessage()));
										}else{
											_unpackBlackResponseObject.call(client,JSONRPC2Response.getResult(),handler);
										}
									}
								}
							}else{
								if(response.id!=null){
									var handler=handlers[response.id];
									if(handler!=null){
										handler.reject(_JSONRPC2Response.INVALID_RESPONSE);
									}
								}else{
									//don't where to send error, silently ignored
								}
							}
						}
					}else{
						_broadcastError(handlers,_JSONRPC2Response.INVALID_RESPONSE);
					}
				},function(error){
					_broadcaseError(handlers,error);
				});
				return deferred;
			};
			this.reset=function(){
				var requests=[];
				var handlers={};
				this._requests=requests;
				this._handlers=handlers;
			};
			var _broadcastError=function(handlers,error){
				for(var n in handlers){
					handlers[n].reject(error);
				}
			};
		})());
		
	})());

	
	return BlackClient;
		
});
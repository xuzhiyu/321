/**
 * @author jinlan
 * 2011-8-20
 */
define("blackJS/CachedServiceProvider", ['dojo','blackJS.BlackJS'], function(dojo,BlackJS) {
	
	var CachedServiceProvider=dojo.declare(null, new (function(){
		
		var NULL_ARGUMENT_EXCEPTION=BlackJS.NULL_ARGUMENT_EXCEPTION;

		this._core;
		this._cache;
		
		this.constructor=function(core){
			if(core==null){
				throw NULL_ARGUMENT_EXCEPTION;
			}
			var cache={};
			this._cache=cache;
			this._core=core;
		};
		
		this.getService=function(serviceName){
			if(serviceName==null){
				throw NULL_ARGUMENT_EXCEPTION;
			}
			var cache=this._cache
			var core=this._core;
			var cachedServiceObject=cache[serviceName];
			if(cachedServiceObject!=null){
				return cachedServiceObject;
			}
			var serviceObject=core.getService(serviceName);
			if(serviceObject!=null){
				cache[serviceName]=serviceObject;
				return serviceObject;
			}
		};


	})());
	
	return CachedServiceProvider;
	
});
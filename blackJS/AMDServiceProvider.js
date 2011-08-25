/**
 * @author jinlan
 * 2011-8-19
 */
define("blackJS/AMDServiceProvider", ['dojo','blackJS.BlackJS'], function(dojo,BlackJS) {
	
	var AMDServiceProvider=dojo.declare(null, new (function(){
		
		var NULL_ARGUMENT_EXCEPTION=BlackJS.NULL_ARGUMENT_EXCEPTION;

		this._core;
		this._context;
		
		this.constructor=function(core,context){
			if(core==null){
				throw NULL_ARGUMENT_EXCEPTION;
			}
			this._core=core;
			this._context=context;
		};
		
		this.getService=function(serviceName){
			if(serviceName==null){
				throw NULL_ARGUMENT_EXCEPTION;
			}
			var context=this._context;
			if(context!=null){
				var AMDPosition=context+AMDServiceProvider.PACKAGE_SEPARATOR+serviceName;
			}else{
				var AMDPosition=serviceName;
			}
			var serviceConstructor=dojo.getObject(AMDPosition);
			if(serviceConstructor==null){
				return null;
			}
			var core=this._core;
			var service=new serviceConstructor(core);
			return service;
		};


	})());
	
	AMDServiceProvider.PACKAGE_SEPARATOR='.';
	
	return AMDServiceProvider;
	
});
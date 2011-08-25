/**
 * @author jinlan
 * 2011-8-10
 */
define("blackJS/BlackJS", ['dojo'], function(dojo) {

	var BlackJS=dojo.declare(null, new (function(){
		

	})());
	
	BlackJS.NULL_ARGUMENT_EXCEPTION=new Error('null argument');
	BlackJS.SERVICE_NOT_DEFINED_EXCEPTION=new Error('service not defined');
	BlackJS.checkInterface=function(object,methods){
		if(object==null || methods==null){
			throw NULL_ARGUMENT_EXCEPTION;
		}
		for(var n in methods){
			if(object[methods[n]]==null){
				return false;
			}
		}
		return true;
	};
	
	return BlackJS;
		
});
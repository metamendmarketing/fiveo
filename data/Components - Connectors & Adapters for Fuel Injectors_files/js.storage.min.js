(function(factory){var registeredInModuleLoader=false;if(typeof define==='function'&&define.amd){define(['jquery','jquery/jquery.cookie'],factory);registeredInModuleLoader=true;}
if(typeof exports==='object'){module.exports=factory();registeredInModuleLoader=true;}
if(!registeredInModuleLoader){var OldStorages=window.Storages;var api=window.Storages=factory();api.noConflict=function(){window.Storages=OldStorages;return api;};}}(function(){var class2type={};var toString=class2type.toString;var hasOwn=class2type.hasOwnProperty;var fnToString=hasOwn.toString;var ObjectFunctionString=fnToString.call(Object);var getProto=Object.getPrototypeOf;var apis={};var cookie_local_prefix="ls_";var cookie_session_prefix="ss_";function _get(){var storage=this._type,l=arguments.length,s=window[storage],a=arguments,a0=a[0],vi,ret,tmp,i,j;if(l<1){throw new Error('Minimum 1 argument must be given');}else if(Array.isArray(a0)){ret={};for(i in a0){if(a0.hasOwnProperty(i)){vi=a0[i];try{ret[vi]=JSON.parse(s.getItem(vi));}catch(e){ret[vi]=s.getItem(vi);}}}
return ret;}else if(l==1){try{return JSON.parse(s.getItem(a0));}catch(e){return s.getItem(a0);}}else{try{ret=JSON.parse(s.getItem(a0));if(!ret){throw new ReferenceError(a0+' is not defined in this storage');}}catch(e){throw new ReferenceError(a0+' is not defined in this storage');}
for(i=1;i<l-1;i++){ret=ret[a[i]];if(ret===undefined){throw new ReferenceError([].slice.call(a,0,i+1).join('.')+' is not defined in this storage');}}
if(Array.isArray(a[i])){tmp=ret;ret={};for(j in a[i]){if(a[i].hasOwnProperty(j)){ret[a[i][j]]=tmp[a[i][j]];}}
return ret;}else{return ret[a[i]];}}}
function _set(){var storage=this._type,l=arguments.length,s=window[storage],a=arguments,a0=a[0],a1=a[1],vi,to_store=isNaN(a1)?{}:[],type,tmp,i;if(l<1||!_isPlainObject(a0)&&l<2){throw new Error('Minimum 2 arguments must be given or first parameter must be an object');}else if(_isPlainObject(a0)){for(i in a0){if(a0.hasOwnProperty(i)){vi=a0[i];if(!_isPlainObject(vi)&&!this.alwaysUseJson){s.setItem(i,vi);}else{s.setItem(i,JSON.stringify(vi));}}}
return a0;}else if(l==2){if(typeof a1==='object'||this.alwaysUseJson){s.setItem(a0,JSON.stringify(a1));}else{s.setItem(a0,a1);}
return a1;}else{try{tmp=s.getItem(a0);if(tmp!=null){to_store=JSON.parse(tmp);}}catch(e){}
tmp=to_store;for(i=1;i<l-2;i++){vi=a[i];type=isNaN(a[i+1])?"object":"array";if(!tmp[vi]||type=="object"&&!_isPlainObject(tmp[vi])||type=="array"&&!Array.isArray(tmp[vi])){if(type=="array")tmp[vi]=[];else tmp[vi]={};}
tmp=tmp[vi];}
tmp[a[i]]=a[i+1];s.setItem(a0,JSON.stringify(to_store));return to_store;}}
function _remove(){var storage=this._type,l=arguments.length,s=window[storage],a=arguments,a0=a[0],to_store,tmp,i,j;if(l<1){throw new Error('Minimum 1 argument must be given');}else if(Array.isArray(a0)){for(i in a0){if(a0.hasOwnProperty(i)){s.removeItem(a0[i]);}}
return true;}else if(l==1){s.removeItem(a0);return true;}else{try{to_store=tmp=JSON.parse(s.getItem(a0));}catch(e){throw new ReferenceError(a0+' is not defined in this storage');}
for(i=1;i<l-1;i++){tmp=tmp[a[i]];if(tmp===undefined){throw new ReferenceError([].slice.call(a,1,i).join('.')+' is not defined in this storage');}}
if(Array.isArray(a[i])){for(j in a[i]){if(a[i].hasOwnProperty(j)){delete tmp[a[i][j]];}}}else{delete tmp[a[i]];}
s.setItem(a0,JSON.stringify(to_store));return true;}}
function _removeAll(reinit_ns){var keys=_keys.call(this),i;for(i in keys){if(keys.hasOwnProperty(i)){_remove.call(this,keys[i]);}}
if(reinit_ns){for(i in apis.namespaceStorages){if(apis.namespaceStorages.hasOwnProperty(i)){_createNamespace(i);}}}}
function _isEmpty(){var l=arguments.length,a=arguments,a0=a[0],i;if(l==0){return(_keys.call(this).length==0);}else if(Array.isArray(a0)){for(i=0;i<a0.length;i++){if(!_isEmpty.call(this,a0[i])){return false;}}
return true;}else{try{var v=_get.apply(this,arguments);if(!Array.isArray(a[l-1])){v={'totest':v};}
for(i in v){if(v.hasOwnProperty(i)&&!((_isPlainObject(v[i])&&_isEmptyObject(v[i]))||(Array.isArray(v[i])&&!v[i].length)||(typeof v[i]!=='boolean'&&!v[i]))){return false;}}
return true;}catch(e){return true;}}}
function _isSet(){var l=arguments.length,a=arguments,a0=a[0],i;if(l<1){throw new Error('Minimum 1 argument must be given');}
if(Array.isArray(a0)){for(i=0;i<a0.length;i++){if(!_isSet.call(this,a0[i])){return false;}}
return true;}else{try{var v=_get.apply(this,arguments);if(!Array.isArray(a[l-1])){v={'totest':v};}
for(i in v){if(v.hasOwnProperty(i)&&!(v[i]!==undefined&&v[i]!==null)){return false;}}
return true;}catch(e){return false;}}}
function _keys(){var storage=this._type,l=arguments.length,s=window[storage],keys=[],o={};if(l>0){o=_get.apply(this,arguments);}else{o=s;}
if(o&&o._cookie){var cookies=Cookies.get();for(var key in cookies){if(cookies.hasOwnProperty(key)&&key!=''){keys.push(key.replace(o._prefix,''));}}}else{for(var i in o){if(o.hasOwnProperty(i)){keys.push(i);}}}
return keys;}
function _createNamespace(name){if(!name||typeof name!="string"){throw new Error('First parameter must be a string');}
if(storage_available){if(!window.localStorage.getItem(name)){window.localStorage.setItem(name,'{}');}
if(!window.sessionStorage.getItem(name)){window.sessionStorage.setItem(name,'{}');}}else{if(!window.localCookieStorage.getItem(name)){window.localCookieStorage.setItem(name,'{}');}
if(!window.sessionCookieStorage.getItem(name)){window.sessionCookieStorage.setItem(name,'{}');}}
var ns={localStorage:_extend({},apis.localStorage,{_ns:name}),sessionStorage:_extend({},apis.sessionStorage,{_ns:name})};if(cookies_available){if(!window.cookieStorage.getItem(name)){window.cookieStorage.setItem(name,'{}');}
ns.cookieStorage=_extend({},apis.cookieStorage,{_ns:name});}
apis.namespaceStorages[name]=ns;return ns;}
function _testStorage(name){var foo='jsapi';try{if(!window[name]){return false;}
window[name].setItem(foo,foo);window[name].removeItem(foo);return true;}catch(e){return false;}}
function _isPlainObject(obj){var proto,Ctor;if(!obj||toString.call(obj)!=="[object Object]"){return false;}
proto=getProto(obj);if(!proto){return true;}
Ctor=hasOwn.call(proto,"constructor")&&proto.constructor;return typeof Ctor==="function"&&fnToString.call(Ctor)===ObjectFunctionString;}
function _isEmptyObject(obj){var name;for(name in obj){return false;}
return true;}
function _extend(){var i=1;var result=arguments[0];for(;i<arguments.length;i++){var attributes=arguments[i];for(var key in attributes){if(attributes.hasOwnProperty(key)){result[key]=attributes[key];}}}
return result;}
var storage_available=_testStorage('localStorage');var cookies_available=typeof Cookies!=='undefined';var storage={_type:'',_ns:'',_callMethod:function(f,a){a=Array.prototype.slice.call(a);var p=[],a0=a[0];if(this._ns){p.push(this._ns);}
if(typeof a0==='string'&&a0.indexOf('.')!==-1){a.shift();[].unshift.apply(a,a0.split('.'));}
[].push.apply(p,a);return f.apply(this,p);},alwaysUseJson:false,get:function(){if(!storage_available&&!cookies_available){return null;}
return this._callMethod(_get,arguments);},set:function(){var l=arguments.length,a=arguments,a0=a[0];if(l<1||!_isPlainObject(a0)&&l<2){throw new Error('Minimum 2 arguments must be given or first parameter must be an object');}
if(!storage_available&&!cookies_available){return null;}
if(_isPlainObject(a0)&&this._ns){for(var i in a0){if(a0.hasOwnProperty(i)){this._callMethod(_set,[i,a0[i]]);}}
return a0;}else{var r=this._callMethod(_set,a);if(this._ns){return r[a0.split('.')[0]];}else{return r;}}},remove:function(){if(arguments.length<1){throw new Error('Minimum 1 argument must be given');}
if(!storage_available&&!cookies_available){return null;}
return this._callMethod(_remove,arguments);},removeAll:function(reinit_ns){if(!storage_available&&!cookies_available){return null;}
if(this._ns){this._callMethod(_set,[{}]);return true;}else{return this._callMethod(_removeAll,[reinit_ns]);}},isEmpty:function(){if(!storage_available&&!cookies_available){return null;}
return this._callMethod(_isEmpty,arguments);},isSet:function(){if(arguments.length<1){throw new Error('Minimum 1 argument must be given');}
if(!storage_available&&!cookies_available){return null;}
return this._callMethod(_isSet,arguments);},keys:function(){if(!storage_available&&!cookies_available){return null;}
return this._callMethod(_keys,arguments);}};if(cookies_available){if(!window.name){window.name=Math.floor(Math.random()*100000000);}
var cookie_storage={_cookie:true,_prefix:'',_expires:null,_path:null,_domain:null,_secure:false,setItem:function(n,v){Cookies.set(this._prefix+n,v,{expires:this._expires,path:this._path,domain:this._domain,secure:this._secure});},getItem:function(n){return Cookies.get(this._prefix+n);},removeItem:function(n){return Cookies.remove(this._prefix+n,{path:this._path});},clear:function(){var cookies=Cookies.get();for(var key in cookies){if(cookies.hasOwnProperty(key)&&key!=''){if(!this._prefix&&key.indexOf(cookie_local_prefix)===-1&&key.indexOf(cookie_session_prefix)===-1||this._prefix&&key.indexOf(this._prefix)===0){Cookies.remove(key);}}}},setExpires:function(e){this._expires=e;return this;},setPath:function(p){this._path=p;return this;},setDomain:function(d){this._domain=d;return this;},setSecure:function(s){this._secure=s;return this;},setConf:function(c){if(c.path){this._path=c.path;}
if(c.domain){this._domain=c.domain;}
if(c.secure){this._secure=c.secure;}
if(c.expires){this._expires=c.expires;}
return this;},setDefaultConf:function(){this._path=this._domain=this._expires=null;this._secure=false;}};if(!storage_available){window.localCookieStorage=_extend({},cookie_storage,{_prefix:cookie_local_prefix,_expires:365*10,_secure:true});window.sessionCookieStorage=_extend({},cookie_storage,{_prefix:cookie_session_prefix+window.name+'_',_secure:true});}
window.cookieStorage=_extend({},cookie_storage);apis.cookieStorage=_extend({},storage,{_type:'cookieStorage',setExpires:function(e){window.cookieStorage.setExpires(e);return this;},setPath:function(p){window.cookieStorage.setPath(p);return this;},setDomain:function(d){window.cookieStorage.setDomain(d);return this;},setSecure:function(s){window.cookieStorage.setSecure(s);return this;},setConf:function(c){window.cookieStorage.setConf(c);return this;},setDefaultConf:function(){window.cookieStorage.setDefaultConf();return this;}});}
apis.initNamespaceStorage=function(ns){return _createNamespace(ns);};if(storage_available){apis.localStorage=_extend({},storage,{_type:'localStorage'});apis.sessionStorage=_extend({},storage,{_type:'sessionStorage'});}else{apis.localStorage=_extend({},storage,{_type:'localCookieStorage'});apis.sessionStorage=_extend({},storage,{_type:'sessionCookieStorage'});}
apis.namespaceStorages={};apis.removeAllStorages=function(reinit_ns){apis.localStorage.removeAll(reinit_ns);apis.sessionStorage.removeAll(reinit_ns);if(apis.cookieStorage){apis.cookieStorage.removeAll(reinit_ns);}
if(!reinit_ns){apis.namespaceStorages={};}};apis.alwaysUseJsonInStorage=function(value){storage.alwaysUseJson=value;apis.localStorage.alwaysUseJson=value;apis.sessionStorage.alwaysUseJson=value;if(apis.cookieStorage){apis.cookieStorage.alwaysUseJson=value;}};return apis;}));
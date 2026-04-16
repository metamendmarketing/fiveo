define(['jquery','jquery-ui-modules/widget'],function($){'use strict';var enhancedMageValidation={options:{errorPlacement:function(error,element){var errorPlacement=element,fieldWrapper,messageBox;if(element.hasClass('_has-datepicker')){errorPlacement=element.siblings('button');}
fieldWrapper=element.closest('.addon');if(fieldWrapper.length){errorPlacement=fieldWrapper.after(error);}
if(element.is(':checkbox')||element.is(':radio')){errorPlacement=element.parents('.control').children().last();if(!errorPlacement.length){errorPlacement=element.siblings('label').last();}}
if(element.attr('data-errors-msg-box')){messageBox=$(element.attr('data-errors-msg-box'));messageBox.html(error);return;}
if(element.siblings('.tooltip').length){errorPlacement=element.siblings('.tooltip');}
if(element.next().find('.tooltip').length){errorPlacement=element.next();}
errorPlacement.after(error);}}};return function(mageValidation){$.widget('mage.validation',mageValidation,enhancedMageValidation);return $.mage.validation;};});
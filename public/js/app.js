'use strict';

$('.edit-button').on('click', function() {
    $(this).next().removeClass('hide-me');
    $(this).addClass('hide-me');
});

$('select.categories').change(function() {
  let selectedCategory = $(this).children('option:selected').val();

  $('.categories option').each(function(){
    $(this).removeAttr('name');
  });

  // $(this).attr('name', "shelf");
  console.log('Option: ' + selectedCategory + ' has been selected');

});
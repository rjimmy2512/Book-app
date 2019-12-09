'use strict';

$('.edit-button').on('click', function() {
    $(this).next().removeClass('hide-me');
    $(this).addClass('hide-me');
})
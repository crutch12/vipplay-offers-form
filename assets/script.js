// форма
$(function () {
    //  <form class="js-auth-form" data-context="..." data-ajax>
    //      <div class="js-auth-form-item __focus __filled __error __completed">
    //          <input class="js-auth-form-item-field">
    //      <button class="js-auth-form-button __disabled"></button>

    var config = {
        event: {
            init:   'auth:form:init',
            submit: 'auth:form:submit',
            maskComplete: 'auth:form:maskcomplete'
        },
        selector: {
            form:   '.js-auth-form',
            item:   '.js-auth-form-item', // __focus __filled __error __completed
            field:  '.js-auth-form-item-field',
            button: '.js-auth-form-button' // __disabled
        },
        phoneMask: {
            placeholder: '+7 XXX XXX XX XX',
            onComplete: function (cep, event, currentField) {
                $(currentField).closest(config.selector.item).addClass('__completed');
                $(document).trigger(config.event.maskComplete, {
                    context: $(currentField).closest(config.selector.form).attr('data-context'),
                    form: $(currentField).closest(config.selector.form)[0]
                });
            },
            onChange: function (cep, event, currentField) {
                $(currentField).closest(config.selector.item).removeClass('__completed');
            }
        }
    };
    $.jMaskGlobals.watchInputs = false;

    $(document).on(config.event.init, formInit);

    function formInit(e, data) {
        var formSelector = data ? data.form ? data.form : config.selector.form : config.selector.form;

        $(formSelector).each(function () {
            var $form = $(this),
                context = $form.data('context'),
                $fields = $(config.selector.field, $form);

            $fields.on('focus', onFocus);
            $fields.on('blur', onBlur);
            $form.on('submit', onSubmit);

            $('[type="phone"]', $form).mask('+7-000-000-00-00', config.phoneMask);
        });
    }

    function onFocus(e) {
        $(e.target).closest(config.selector.item).removeClass('__error').addClass('__focus');
    }

    function onBlur(e) {
        $(e.target).closest(config.selector.item).removeClass('__focus');
    }

    function onSubmit(e) {
        $(document).trigger(config.event.submit, {
            context: e.target.getAttribute('data-context'),
            form: e.target
        });
        if ($(e.target).is('[data-ajax]')) {
            return false;
        }
    }
});

// попап
$(function () {
    var $popup = $('.js-auth-form-popup[data-popup="code"]');

    $(document).on('auth:popup:open', popupOpen);
    $(document).on('auth:popup:close', popupClose);

    $('.js-auth-form-popup-close').on('click', function () {
        $(document).trigger('auth:popup:close', {el: $(this).closest('.js-auth-form-popup')});
        return false;
    });

    function popupOpen(e, data) {
        data = data || {};
        if (!data.el) data.el = $popup;
        if (data.msg) {
            $(data.el).find('.js-auth-form-popup-text').html(data.msg);
        }
        $(data.el).addClass('__opened');
        $('html').addClass('auth-form-popup-opened');
    }

    function popupClose(e, data) {
        data = data || {};
        if (!data.el) data.el = $popup;
        $(data.el).removeClass('__opened');
        setTimeout(function(){
            $('.js-auth-form-popup-container', $(data.el)).addClass('__invisible').eq(0).removeClass('__invisible');
        },500);
        if (!$('.js-auth-form-popup.__opened').length) {
            $('html').removeClass('auth-form-popup-opened');
        }
    }
});

// основной скрипт
$(function () {

    var $form = $('.js-auth-form[data-context="phone"]'),
        $formCode = $('.js-auth-form[data-context="code"]'),
        $fields = $('.auth-form-item-field', $form),
        $button = $('.js-auth-form-button', $form),
        $popup = $('.js-auth-form-popup[data-popup="code"]'),

        $popupContainer = $('.js-auth-form-popup-container'),
        $popupPhone = $('.js-auth-form-phone'),
        $popupCode = $('.js-auth-form-code'),
        $popupSuccess = $('.js-auth-form-success'),

        $buttonSms = $('.js-auth-form-code-button'),
        $fieldSms = $('.js-auth-form-code-field'),
        step = $form.data('step');

    $('.js-auth-form-popup-open').on('click', function (e) {
        $(document).trigger('auth:popup:open', {el: $popup});
    });

    $('.js-auth-form-code-resend').on('click', function () {
        $popupCode.find('.auth-form-item__code').removeClass('__error').find('.auth-form-item-field').val('').change();
        $form.trigger('submit');
    });

    $(document).trigger('auth:form:init', {form: '.js-auth-form[data-context="phone"]'});
    $(document).trigger('auth:form:init', {form: '.js-auth-form[data-context="code"]'});

    $fields.on('change keyup', changeField);
    $fieldSms.on('change keyup', changeSmsField);

    $(document).on('auth:form:maskcomplete', function (e, data) {
        var $form = $(data.form);

        checkFilledAll();
        $form.find('.js-auth-form-button').toggleClass('__disabled', $fields.length != $fields.parents('.auth-form-item.__filled').length);
    });

    $(document).on('auth:form:submit', function (e, data) {
        var $form = $(data.form);

        if (data.context == 'phone') {
            if (validateForm1()) {
                $button.attr('disabled', true);
                $.ajax({
                    url: $form.attr('action'),
                    type: 'POST',
                    cache: false,
                    dataType: 'json',
                    data: $form.serialize(),
                    success: $.proxy(successForm1, this),
                    complete: function () {
                        $button.attr('disabled', false);
                    }
                });
            }
        }
        if (data.context == 'code') {
            if (validateForm2()) {
                $buttonSms.attr('disabled', true);
                $.ajax({
                    url: $form.attr('action'),
                    type: 'POST',
                    cache: false,
                    dataType: 'json',
                    data: {code: $('.js-auth-form-code-field').val()},
                    success: $.proxy(successForm2, this),
                    complete: function () {
                        $buttonSms.attr('disabled', false);
                    }
                });
            }
        }
    });

    checkFilledAll();


    /* functions*/

    function successForm1(data) {
        $button.attr('disabled', false);

        // заменить на свою логику после успешной отправки телефона
        if (data.success) {
            $popupContainer.addClass('__invisible');
            $popupCode.removeClass('__invisible');
        }
        if (data.errors) {
            $popupPhone.find('.auth-form-item__phone').addClass('__error');
        }
    }

    function successForm2(data) {
        $buttonSms.attr('disabled', false);

        // заменить на свою логику после успешной отправки sms кода
        if (data.success) {
            $popupContainer.addClass('__invisible');
            $popupSuccess.removeClass('__invisible');
            $form[0].reset();
            $formCode[0].reset();
        }
        if (data.errors) {
            $popupCode.find('.auth-form-item__code').addClass('__error');
        }
    }

    function changeField(e) {
        var $item = $(e.target).parents('.auth-form-item');

        $item.removeClass('__error').toggleClass('__filled', checkFilled(e.target));
        $button.toggleClass('__disabled', !validateForm1(true));
    }

    function changeSmsField(e) {
        var $item = $(e.target).parents('.auth-form-item');

        $item.removeClass('__error').toggleClass('__filled', checkFilled(e.target));
        $buttonSms.toggleClass('__disabled', $(e.target).val().length < 3 || !$item.is('.__filled') || !validateForm1(true));
    }

    function checkFilledAll() {
        $fields.each(function () {
            $(this).parents('.auth-form-item').toggleClass('__filled', checkFilled(this));
        });
    }

    function checkFilled(field) {
        var _filled = false;

        if ($(field).is('[type="checkbox"]')) {
            _filled = !!$(field).prop('checked');
        } else {
            _filled = !!$(field).val().length;
        }
        return _filled;
    }

    function checkField(field) {
        var _val = field.val();

        if ($(field).is(':disabled')) return false;
        if (field.attr('type') == 'email') {
            return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(_val);
        }
        if (field.attr('type') == 'phone' || field.attr('data-type') == 'phone') {
            return $(field).closest('.auth-form-item').hasClass('__completed') && /^(\+7|8)\-\d{3}\-\d{3}\-\d{2}\-\d{2}$/.test(_val);
        }
        if ($(field).is('[type="checkbox"]')) return field.prop('checked');
        return checkFilled(field);
    }

    function validateForm1(disableErrorCheck) {
        var _valid = true;

        checkFilledAll();
        $fields.each(function () {
            var _item = $(this).closest('.auth-form-item');

            if (!disableErrorCheck) _item.toggleClass('__error', !checkField($(this)));
            if ((!_item.hasClass('__filled') || _item.hasClass('__error')) && _valid) {
                _valid = false;
            }
        });
        return _valid;
    }

    function validateForm2() {
        var _item = $fieldSms.closest('.auth-form-item');
        var _valid = !!$fieldSms.val();

        _item.toggleClass('__error', !_valid);
        return validateForm1() && _valid;
    }

});

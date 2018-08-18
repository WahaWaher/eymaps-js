/**
 * jQuery.eyMaps
 * Version: 1.0.1
 * Repo: https://github.com/WahaWaher/eymaps-js
 * Author: Sergey Kravchenko
 * Contacts: wahawaher@gmail.com
 * License: MIT
 */

;(function($) {

	var methods = {

		init: function(options) {

			var defaults = $.extend(true, {

				api: 'https://api-maps.yandex.ru/2.1/?lang=ru_RU', // Ссылка на Yandex Map API
				zoomAfter: 'click', // Разрешает зум карты только по опр. событию на эл-те карты 
				event: false, // Подгрузка карты по событию.
				placemarkDefaults: {}, // Опции поумолчанию для всех меток

				beforeInit: function() {}, // Перед началом инициализации.
				beforeLoad: function() {}, // До загрузки карты.
				afterLoad:  function() {}, // По окончанию загрузки карты.

				map: { center: [], zoom: 5 },
				placemark: [
					{ geometry: [], properties: {}, options: {} }
				],

			}, $.fn.eyMaps.defaults);

			this.each(function() {
				var $ths = $(this);

				if( $ths.data('_init') == true ) return false;

				$ths.data('defaults', defaults);
				$ths.data('options', options);

				var data = $ths.attr('data-eymaps');
				data = eval('(' + data + ')');
				if( typeof(data) != 'object') data = {};

				$ths.data('settings', $.extend(true, {}, defaults, options, data));
				var sets = $ths.data('settings');

				// Callback: beforeInit()
				sets.beforeInit.call($ths, sets);

				// Доб. класс контейнеру
				$ths.addClass('eymaps');

				// Если у элемента отсутствует ID - генер./добавл.
				sets._mid;
				if( !$ths.attr('id') ) {
					sets._mid = 'eymaps-mid-' + randInt(0, 100000);
					$ths.attr('id', sets._mid);
				} else sets._mid = $ths.attr('id');

				// ID для генерации уник. пространства имен
				sets._nsid = randInt(10000000, 100000000);

				// Загрузка по событию/автозагрузка карты
				sets.event ? $ths.one( sets.event + '.eym-' + sets._nsid, function() {
					methods.load.call($ths);
				}) : methods.load.call($ths);

				$ths.data('_init', true);

			});

			return $(this);

		},

		destroy: function() {

			if( !$(this).data('_init') ) return false;
			var $ths = $(this), sets = $ths.data('settings');

				if( $ths.attr('id') == sets._mid && $ths.attr('id').match(/-mid-/igm) )
					$ths.removeAttr('id');

				$ths.removeClass('eymaps')
					 .off( sets.event + '.eym-' + sets._nsid )
					 .removeData()
					 .children().remove();

			return $(this);

		},

		reinit: function(newOpts) {

			var $ths = $(this), sets = $ths.data('settings');

			var oldOpts = $ths.data('options');
			methods.destroy.call($ths);

			if( newOpts && typeof(newOpts) == 'object' )
				methods.init.call($ths, newOpts);
			else methods.init.call($ths, oldOpts);

			return $(this);

		},

		load: function() {
			
			var $ths = this, sets = $ths.data('settings');

			if( !sets ) return false;

			// ОСНОВНАЯ ПРОВЕРКА ПЕРЕД ЗАГРУЗКОЙ
			var apiScript = $('script[src="'+ sets.api +'"]');

			if( apiScript.length && typeof(ymaps) === 'object' ) {

				// Скрипт API есть на странице и полностью загружен - загрузка карты
				loadYaMap();

			} else if( apiScript.length && typeof(ymaps) !== 'object' ) {
				
				// Скрипт API есть на странице, но не полностью загружен - загрузка карты после загрузки скрипта
				apiScript.on('load', loadYaMap);

			} else {

				// Загрузка скрипта и загрузка карты
				loadYaApi(sets.api, loadYaMap);

			}

		   // ОТРИСОВКА КАРТЫ
		   function loadYaMap() {

		   	// Если карта еще не подгружена - загружаем
		   	if( $ths.get(0).firstChild == null ) {
				   ymaps.ready(function () {

				   	// Callback: beforeLoad()
				   	sets.beforeLoad.call($ths, sets);

				   	// (sets.map) Объект с осн. (коорд, зум)
				   	var map = new ymaps.Map(sets._mid, sets.map);

				   	// Зум // sets.zoomAfter
				   	if( sets.zoomAfter ) {
				   		map.behaviors.disable('scrollZoom');
							map.container._parentElement.addEventListener(sets.zoomAfter, function () {
								if( !map.behaviors.isEnabled('scrollZoom') ) map.behaviors.enable('scrollZoom');
							});
				   	}

				   	// Метки // sets.placemark 
				   	if ( typeof(sets.placemark[0].geometry) === 'object' && sets.placemark[0].geometry.length === 2) {
							$.each(sets.placemark, function (key, value) {
								var placemark = new ymaps.Placemark(value.geometry, value.properties, $.extend( {}, sets.placemarkDefaults, value.options ));
								map.geoObjects.add(placemark);
								option1 = {};
							});
				   	}

				   	// Callback: afterLoad()
				   	sets.afterLoad.call($ths, sets);

				   });
			   }
		   };

			// ЗАГРУЗКА API
			function loadYaApi(api, lymCb) {

				var yaScript = $('<script/>').attr('src', api).get(0);
				document.body.appendChild(yaScript);
				yaScript.onload = function() { if( lymCb ) lymCb() };

			};

			return $(this);

		},

	};

	// Функция для генерации случаного числа
	function randInt( min, max ) {
		var rand = min - 0.5 + Math.random() * (max - min + 1)
		rand = Math.round( rand );
		return rand;
	}

	$.fn.eyMaps = function(methOrOpts) {
		if ( methods[methOrOpts] ) {
			return methods[ methOrOpts ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof methOrOpts === 'object' || ! methOrOpts ) {
			methods.init.apply( this, arguments );
			return this;
		} else $.error( 'Method ' +  methOrOpts + ' does not exist on jQuery.eyMaps' );
	};

})(jQuery);
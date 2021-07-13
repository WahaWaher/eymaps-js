/**
 * jQuery.eyMaps
 * Version: 1.0.1
 * Repo: https://github.com/WahaWaher/eymaps-js
 * Author: Sergey Kravchenko
 * Contacts: wahawaher@gmail.com
 * License: MIT
 */

;(function($) {

	/**
	 * Настройки по умолчанию
	 *
	 * @default
	 */
	var defaults = {

		api: 'https://api-maps.yandex.ru/2.1/?lang=ru_RU', // Ссылка на Yandex Map API
		zoomAfter: 'click', // Разрешает зум карты только по опр. событию на эл-те карты 
		event: false, // Подгрузка карты по событию.
		placemarkDefaults: {}, // Опции поумолчанию для всех меток

		map: { center: [], zoom: 5 },
		placemark: [
			{ geometry: [], properties: {}, options: {} }
		]

	};

	/**
	 * Конструктор
	 *
	 * @constructor
	 * @param {HTMLElement} el - HTML-элемент в DOM
	 * @param {Object=} options - Объект с параметрами
	 */
	var EyMaps = function(el, options) {
		this.it = el;
		this.init(options);
	}, __, meth = EyMaps.prototype;

	/**
	 * Инициализация
	 *
	 * @public
	 * @param {object={}} options - Объект с параметрами
	 * @example
	 * 
	 * $(element).eyMaps('init', {});
	 * $(element).eyMaps('init');
	 */
	meth.init = function(options) {
		var _ = this, it = _.it, $it = $(it), sets;

		if( _.inited === true ) return;

		console.log( 'Метод: Init', arguments, _ );

		// Настройки: По умолчанию
		_.defaults =  $.extend(true, {}, defaults, $.fn.eyMaps.defaults);
		// Настройки: Пользовательские
		_.options = options || {};
		// Настройки: Data-атрибут
		_.dataOptions = $it.data('eymaps') || {};
		// Настройки: Объединенные
		_.settings = sets = $.extend(true, {}, _.defaults, _.options, _.dataOptions);

		_.nsid = __.getRndNum(10000, 99999);
		_.nspc = 'eym-' + _.nsid;
		_.mpid = 'eymaps-mid-' + _.nsid;
		_.map = {};

		// Событие: 'beforeInit'
		$it.trigger('beforeInit.eym', [_.it, _]);

		// Доб. класс контейнеру
		$it.addClass('eymaps');

		// Если у элемента отсутствует ID - генер./добавл.
		if( !$it.attr('id') ) $it.attr('id', _.mpid);
		else _.mpid = $it.attr('id');

		// Загрузка по событию/автозагрузка карты
		sets.event ? $it.one( sets.event + '.' + _.nspc, function() {
			_.load.call(_);
		}) : _.load.call(_);

		// Плгин инициализирован
		_.inited = true;

		// Событие: 'afterInit'
		$it.trigger('afterInit.eym', [_.it, _]);
		
	};

	/**
	 * Загружает карту 
	 *
	 * @public
	 */
	meth.load = function() {
		var _    = this,
			 $it = $(_.it),
			 sets = _.settings,

			 apiScript = $('script[src="'+ sets.api +'"]');

		// console.log( 'Метод: Load', arguments );

		// Скрипт API есть на странице и полностью загружен - загрузка карты
		if( apiScript.length && typeof(ymaps) === 'object' ) {

			_.loadMAP();

		// Скрипт API есть на странице, но не полностью загружен - загрузка карты после загрузки скрипта
		} else if( apiScript.length && typeof(ymaps) !== 'object' ) {
			
			
			apiScript.on('load', function() {
				_.loadMAP.call(_);
			});


		// Загрузка скрипта и загрузка карты
		} else {

			_.loadAPI(sets.api, function() {
				_.loadMAP.call(_);
			});

		}

	};

	/**
	 * Загрузка Yandex MAP API на страницу
	 *
	 * @public
	 */
	meth.loadAPI = function(api, cb) {
		var _    = this,
			 $it = $(_.it),
			 sets = _.settings,

			 yaScript = $('<script/>').attr('src', api || sets.api).get(0);

		// console.log( 'Метод: loadAPI', arguments );

		document.body.appendChild(yaScript);

		yaScript.onload = function() {
			if( typeof cb == 'function' ) cb();
		};


	};


	/**
	 * Загрузка Yandex MAP на страницу
	 *
	 * @public
	 */
	meth.loadMAP = function() {
		var _    = this,
			 $it = $(_.it),
			 sets = _.settings;

		if( _.it.firstChild != null  ) return;

		// console.log( 'Метод: loadMAP', arguments );
		
		// Если карта еще не подгружена - загружаем
		ymaps.ready(function () {

			// Событие: 'beforeLoad'
			$it.trigger('beforeLoad.eym', [_.it, _, _.map]);

			// (sets.map) Объект с осн. (коорд, зум)
			_.map = new ymaps.Map(_.mpid, sets.map);

			// Зум // sets.zoomAfter
			if( sets.zoomAfter ) {
				_.map.behaviors.disable('scrollZoom');
				_.map.container._parentElement.addEventListener(sets.zoomAfter, function () {
					if( !_.map.behaviors.isEnabled('scrollZoom') ) _.map.behaviors.enable('scrollZoom');
				});
			}

			// Метки // sets.placemark 
			if ( typeof(sets.placemark[0].geometry) === 'object' && sets.placemark[0].geometry.length === 2) {
				$.each(sets.placemark, function (key, value) {
					var placemark = new ymaps.Placemark(value.geometry, value.properties, $.extend( {}, sets.placemarkDefaults, value.options ));
					_.map.geoObjects.add(placemark);
				});
			}

			// Событие: 'beforeLoad'
			$it.trigger('beforeLoad.eym', [_.it, _, _.map]);

		});

	};


	/**
	 * Деинициализация
	 *
	 * @public
	 * @example
	 * 
	 * $(element).eyMaps('destroy');
	 */
	meth.destroy = function() {
		var _ = this,
			 $it = $(_.it);

		if( !_.inited ) return;

		// console.log( 'Метод: Destroy', arguments );

		if( $it.attr('id') == _.mpid && $it.attr('id').match(/-mid-/igm) )
			$it.removeAttr('id');

		$it.removeClass('eymaps')
			.off( _.settings.event + '.' + _.nspc )
			.empty();

		delete _.it.EyMaps;

	};

	/**
	 * Реинициализация
	 *
	 * @public
	 * @param {object=} newSets - Объект с новыми параметрами
	 * @example
	 * 
	 * $(element).eyMaps('reinit');
	 * $(element).eyMaps('reinit', {});
	 */
	meth.reinit = function(newSets) {
		var _ = this,
			 $it = _.it,
			 sets = (typeof newSets == 'object' && Object.keys(newSets).length != 0 )
					  ? newSets : $.extend(true, {}, _.settings);

		// console.log( 'Метод: Reinit' );

		_.destroy();
		$(_.it).eyMaps(sets);

	};

	__ = {
		/**
		 * Генерирует случайное число
		 *
		 * @private
		 * @param {Number} min - от
		 * @param {Number} max - до
		 */
		getRndNum: function(min, max) {
			return Math.round(min - 0.5 + Math.random() * (max - min + 1));
		}
	};

	$.fn.eyMaps = function() {

		var pn = 'EyMaps',
			 args = arguments,
			 mth = args[0];

		$.each(this, function(i, it) {
			if( typeof mth == 'object' || typeof mth == 'undefined' )
				it[pn] = crtInst(it, mth);
			else if( mth === 'init' || mth === 'reinit' )
				it[pn] ? getMeth(it, mth, args) : it[pn] = crtInst(it, args[1]);
			else getMeth( it, mth, args );
		});

		function getMeth(it, mth, args) {
			if( !(it[pn] instanceof EyMaps) ) return;
			if( !(mth in it[pn]) ) return;
			return it[pn][mth].apply(it[pn], Array.prototype.slice.call(args, 1));
		};

		function crtInst(it, mth) {
			if( it[pn] instanceof EyMaps ) return;
			return new EyMaps(it, mth);
		};

		return this;
	};

	$.fn.eyMaps.defaults = defaults;

})(jQuery);
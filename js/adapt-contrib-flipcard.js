/*
 * adapt-contrib-flipcard
 * License - https://github.com/ExultCorp/adapt-contrib-flipcard/blob/master/LICENSE
 * Maintainers - Himanshu Rajotia <himanshu.rajotia@exultcorp.com>
 */

define([
    'coreViews/componentView',
    'coreJS/adapt',
    'underscore'
], function(ComponentView, Adapt) {

    var Flipcard = ComponentView.extend({

        events: {
            'click .flipcard-item': 'onClickFlipItem'
        },

        preRender: function() {
            this.listenTo(Adapt, 'device:resize', this.reRender, this);
            this.checkIfResetOnRevisit();

            _.each(this.model.get('_items'), function(item) {
                if (!item._flipDirection) {
                    item._flipDirection = 'horizontal';
                }
            });
        },

        // this is use to set ready status for current component on postRender.
        postRender: function() {
            // Adding classes for ie8
            if ($('html').hasClass('ie8')) {
                this.$(".flipcard-item:nth-child(even)").addClass("even");
                this.$(".flipcard-item:nth-child(odd)").addClass("odd");
            }

            var items = this.model.get('_items');
            var $items = this.$('.flipcard-item');

            _.each($items, function(el, i) {
                this.toggleCardSideVisibility($(el));

            }.bind(this));

            if (!Modernizr.testProp('transformStyle', 'preserve-3d')) {
                this.$('.flipcard-item-back').hide();
            }

            // Width css class for single or multiple images in flipcard.
            var className = (items.length > 1) ? 'flipcard-multiple' : 'flipcard-single';
            $items.addClass(className);

            this.$('.flipcard-widget').imageready(_.bind(function() {
                this.setFlipComponentHeight();
                this.setReadyStatus();
            }, this));

        },

        // Used to check if the flipcard should reset on revisit
        checkIfResetOnRevisit: function() {
            var isResetOnRevisit = this.model.get('_isResetOnRevisit');

            // If reset is enabled set defaults
            if (isResetOnRevisit) {
                this.model.reset(isResetOnRevisit);
            }

            _.each(this.model.get('_items'), function(item) {
                item._isVisited = false;
            });
        },

        // This function sets the height of the flipcard component to the first image in the component.
        setFlipComponentHeight: function() {
            var imageHeight = this.$('.flipcard-item-frontImage').eq(0).height();

            if (imageHeight) {
                this.$('.flipcard-item').height(imageHeight);
            }
        },

        // This function called on triggering of device resize and device change event of Adapt.
        reRender: function() {
            this.setFlipComponentHeight();
        },

        // Click or Touch event handler for flip card.
        onClickFlipItem: function(event) {
            if (event && event.target.tagName.toLowerCase() === 'a') {
                return;
            } else {
                event && event.preventDefault();
            }

            var $selectedElement = $(event.currentTarget);
            var flipType = this.model.get('_flipType');

            if (flipType === 'allFlip') {
                this.performAllFlip($selectedElement);
            } else if (flipType === 'singleFlip') {
                this.performSingleFlip($selectedElement);
            }

            _.defer(_.bind(function() {
                this.toggleFlipcardAccessibility($selectedElement);

                if (Adapt.config.has('_accessibility') && Adapt.config.get('_accessibility')._isActive) {
                    _.delay(function() {
                        // Allow animation to complete before focusing
                        $selectedElement.a11y_focus();
                    }, 500);
                }
            }, this));
        },

        // This function will be responsible to perform All flip on flipcard
        // where all cards can flip and stay in the flipped state.
        performAllFlip: function($selectedElement) {
            if (!Modernizr.testProp('transformStyle', 'preserve-3d')) {
                var $frontflipcard = $selectedElement.find('.flipcard-item-front');
                var $backflipcard = $selectedElement.find('.flipcard-item-back');
                var flipTime = this.model.get('_flipTime') || 'fast';

                if ($frontflipcard.is(':visible')) {
                    $frontflipcard.fadeOut(flipTime, function() {
                        $backflipcard.fadeIn(flipTime);
                    });
                } else if ($backflipcard.is(':visible')) {
                    $backflipcard.fadeOut(flipTime, function() {
                        $frontflipcard.fadeIn(flipTime);
                    });
                }
            }

            // Regardless of whether or not csstransforms3d is supported
            // the flipcard-flip class should be added
            $selectedElement.toggleClass('flipcard-flip');

            var flipcardElementIndex = this.$('.flipcard-item').index($selectedElement);
            this.setVisited(flipcardElementIndex);
        },

        toggleFlipcardAccessibility: function($selectedElement) {
            if (this.model.get('flipType') === 'allFlip') {
                this.toggleCardSideVisibility($selectedElement);
            } else {
                _.each(this.$('.flipcard-item'), function(el) {
                    this.toggleCardSideVisibility($(el));
                }.bind(this));
            }
        },

        toggleCardSideVisibility: function($selectedElement) {
            var hasBeenFlipped = $selectedElement.hasClass('flipcard-flip');
            var $front = $selectedElement.find('.flipcard-item-front');
            var $back = $selectedElement.find('.flipcard-item-back');

            if (hasBeenFlipped) {
                // Hide back, enable front
                $front.attr('aria-hidden', 'true').addClass('a11y-ignore');
                $back.attr('aria-hidden', 'false').removeClass('a11y-ignore');
            } else {
                // Hide front, enable back
                $front.attr('aria-hidden', 'false').removeClass('a11y-ignore');
                $back.attr('aria-hidden', 'true').addClass('a11y-ignore');
            }
        },

        // This function will be responsible to perform Single flip on flipcard where
        // only one card can flip and stay in the flipped state.
        performSingleFlip: function($selectedElement) {
            var $flipcardContainer = $selectedElement.closest('.flipcard-widget');
            if (!Modernizr.testProp('transformStyle', 'preserve-3d')) {
                var $flipcardItem = $selectedElement.closest('.flipcard-item');
                var $frontflipcard = $selectedElement.find('.flipcard-item-front');
                var $backflipcard = $selectedElement.find('.flipcard-item-back');
                var flipTime = this.model.get('_flipTime') || 'fast';

                if ($backflipcard.is(':visible')) {
                    $flipcardItem.addClass('flipcard-flip');
                    $backflipcard.fadeOut(flipTime, function() {
                        $frontflipcard.fadeIn(flipTime);
                    });
                } else {
                    var $visibleflipcardBack = $flipcardContainer.find('.flipcard-item-back:visible');
                    if ($visibleflipcardBack.length > 0) {
                        $flipcardItem.removeClass('flipcard-flip');
                        $visibleflipcardBack.fadeOut(flipTime, function() {
                            $flipcardContainer.find('.flipcard-item-front:hidden').fadeIn(flipTime);
                        });
                    }
                    $frontflipcard.fadeOut(flipTime, function() {
                        $backflipcard.fadeIn(flipTime);
                    });
                }
            } else {
                if ($selectedElement.hasClass('flipcard-flip')) {
                    $selectedElement.removeClass('flipcard-flip');
                } else {
                    $flipcardContainer.find('.flipcard-item').removeClass('flipcard-flip');
                    $selectedElement.addClass('flipcard-flip');
                }
            }

            var flipcardElementIndex = this.$('.flipcard-item').index($selectedElement);
            this.setVisited(flipcardElementIndex);
        },

        // This function will set the visited status for particular flipcard item.
        setVisited: function(index) {
            var item = this.model.get('_items')[index];
            item._isVisited = true;
            this.checkCompletionStatus();
        },

        // This function will be used to get visited states of all flipcard items.
        getVisitedItems: function() {
            return _.filter(this.model.get('_items'), function(item) {
                return item._isVisited;
            });
        },

        // This function will check or set the completion status of current component.
        checkCompletionStatus: function() {
            if (this.getVisitedItems().length === this.model.get('_items').length) {
                this.setCompletionStatus();
            }
        }
    });

    Adapt.register('flipcard', Flipcard);

    return Flipcard;

});

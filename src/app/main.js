angular
    .module('app')
    .component('app', {
        templateUrl: 'app/main.html',
        controller: MainController
    });


/** @ngInject */
function MainController($scope, $localStorage) {
    var _private = {};
    var apply = function ($scope) {
        $scope.$apply();
    };
    var microgear;
    var vm = this;

    var speak = function (text, endFn, startFn) {
        console.log("SPEAKING...");
        _private.utterance = new SpeechSynthesisUtterance();
        _private.utterance.text = text;
        _private.utterance.pitch = 1.0;
        _private.utterance.volume = 1.0;
        _private.utterance.rate = 1.2;
        _private.utterance.lang = 'th-TH';
        _private.utterance.onstart = function (event) {
            if (startFn) {
                startFn(event);
            }
        };

        _private.utterance.onend = function (event) {
            if (endFn) {
                endFn(event);
            }
        };

        window.speechSynthesis.speak(_private.utterance, function () {
            console.log("SPEAKING CALLBACK", arguments);
        });
    };




    $scope.is_connected = false;
    $scope.status = 'Waiting..';

    $scope.$storage = $localStorage.$default({
        appId: '',
        appKey: '',
        appSecret: '',
        onText: 'ON',
        offText: 'OFF',
        chatWith: 'plug001',
        alias: 'html5gear'
    });

    $storage = $scope.$storage;


    $scope.$on('$viewContentLoaded', function () {
        console.log("LOADED");
    });

    $scope.$watch('switch', function (newVal, oldVal) {
        console.log("SWITCH CHANGED", arguments);
        if (newVal === undefined) {
            return;
        }

        var text = {
            true: $storage.onText,
            false: $storage.offText,
        };

        console.log($storage.chatWith, text[newVal]);
        microgear.chat($storage.chatWith, text[newVal]);
    });

    $scope.doDisconnect = function () {
        microgear.disconnect();
        $scope.is_connected = false;
        $scope.status = 'Disconnected.';
    };

    $scope.doConnect = function () {
        microgear = Microgear.create({
            key: $scope.$storage.appKey,
            secret: $scope.$storage.appSecret,
            appId: $scope.$storage.appId
        });

        console.log(microgear);

        if (!microgear) {
            console.log("no microgear");
            return;
        }

        $scope.status = 'Connecting..';
        microgear.subscribe('/#');
        microgear.on('connected', function () {
            speak("เชื่อมต่อ NET PIE แล้ว, มีอะไรให้ช่วยบ้าง?", function () {

            });
            // this.status = "connected";
            console.log('Connected...');
            $scope.status = 'Connected..';
            microgear.setAlias($scope.alias || 'mygear');
            $scope.is_connected = true;
            apply($scope);
        });

        microgear.on('message', function (topic, body) {
            console.log('incoming : ' + topic + ' : ' + body);
            $scope.topic = topic;
            $scope.message = body;
            apply($scope);
        });

        microgear.on('closed', function () {
            $scope.is_connected = false;
            console.log('Closed...');
            apply($scope);
        });


        microgear.on('present', function (event) {
            console.log(event);
        });

        microgear.on('absent', function (event) {
            console.log(event);
        });


        microgear.connect($scope.$storage.appId)

    };
}

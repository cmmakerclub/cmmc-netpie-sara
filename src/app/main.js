angular
    .module('app')
    .component('app', {
        templateUrl: 'app/main.html',
        controller: MainController
    });


/** @ngInject */
function MainController($scope, $localStorage) {
    var apply = function ($scope) {
        $scope.$apply();
    };
    var microgear;
    var vm = this;
    var final_transcript = '';
    var start_timestamp;

    var speak = function (text, endFn, startFn) {
        console.log("SPEAKING...");
        vm.utterance = new SpeechSynthesisUtterance();
        vm.utterance.text = text;
        vm.utterance.pitch = 1.0;
        vm.utterance.volume = 1.0;
        vm.utterance.rate = 1;
        vm.utterance.lang = 'th-TH';
        vm.utterance.onstart = function (event) {
            if (startFn) {
                startFn(event);
            }
        };

        vm.utterance.onend = function (event) {
            if (endFn) {
                endFn(event);
            }
        };

        window.speechSynthesis.speak(vm.utterance, function () {
            console.log("SPEAKING CALLBACK", arguments);
        });
    };


    var upgrade = function () {
        console.log("UPGRADE");
        $scope.msg = "SHOULD BE UPGRADE";
    };

    if (!('webkitSpeechRecognition' in window)) {
        upgrade();
    }
    else {
        $scope.recognition = new webkitSpeechRecognition();
        $scope.recognition.lang = "th-TH";
        $scope.recognition.continuous = true;
        $scope.recognition.interimResults = true;

        $scope.recognition.onstart = function () {
            $scope.recognizing = true;
            console.log("ON START", arguments);
        };

        $scope.recognition.onend = function () {
            console.log("ON END", arguments);
            $scope.recognizing = false;
            if ($scope.ignore_onend) {
                return;
            }
        };

        $scope.recognition.onerror = function (event) {
            console.log("ERROR");
            if (event.error == 'no-speech') {
                // start_img.src = 'mic.gif';
                // showInfo('info_no_speech');
                $scope.ignore_onend = true;
            }

            if (event.error == 'audio-capture') {
                $scope.ignore_onend = true;
            }

            if (event.error == 'not-allowed') {
                // if (event.timeStamp - start_timestamp < 100) {
                //   showInfo('info_blocked');
                // } else {
                //   showInfo('info_denied');
                // }
                $scope.ignore_onend = true;
            }
        };

        $scope.recognition.onresult = function (event) {
            // console.log("on_result", event);
            // var regEx= /^([-+])?(\d*)$/i;
            var patt = /(เปิด|ปิด)(ไฟ)(.*)/i
            var interim_transcript = '';
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                // console.log(event.results[i]);
                var matches=[];
                if (event.results[i].isFinal) {
                    // final_transcript += event.results[i][0].transcript;
                    final_transcript = event.results[i][0].transcript;
                    matches = final_transcript.match(patt);
                    console.log("matches", matches);
                    if (matches != null) {
                        $scope.recognition.stop();
                        $scope.command = matches;
                        speak(matches[0], function() {
                            $scope.start_regcognize();
                        });
                    }
                } else {
                    interim_transcript += event.results[i][0].transcript;
                    interim_transcript += ",";
                    matches = interim_transcript.match(patt);
                    // console.log("matches", matches);
                    // if (matches != null) {
                    //     $scope.recognition.stop();
                    //     $scope.command = matches;
                    //     speak(matches[0], function() {
                    //         $scope.start_regcognize();
                    //     });
                    // }
                }


                $scope.interim = interim_transcript;
                apply($scope);

            }

            $scope.final_text = final_transcript;
            console.log($scope.final_text);
            $scope.recognizing = false;
            apply($scope);
        }
    }

    $scope.start_regcognize = function () {
        if ($scope.recognizing) {
            console.log("STOP");
            $scope.recognition.stop();
            return;
        }

        final_transcript = '';
        // $scope.recognition.lang = "th-TH";
        $scope.recognition.start();

        $scope.ignore_onend = false;
        start_timestamp = event.timeStamp;

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
            speak("ระบบเชื่อมต่อแล้ว, มีอะไรให้ช่วยเหลือคะ", function () {
                console.log("DONRE");
                $scope.start_regcognize();
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

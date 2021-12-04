import { displayHeatmap, displayJointHeatmap, setProgress, setSliders, displayModal, displayExamples } from "./display.js";

var attentionViz = 'none';
var styleMode = 'micro-joint';
var editorText = '';

let examples = {
    "micro-formality": [
        "I'm gonna go play now, u wanna come?",
        "i’m gonna go crazy when i get my EAD card",
        "why do you have to ask such questions?"
    ],
    "micro-joint": [
        "yes sure you're very appealing to me...LOL",
    ],
    "macro-shakespeare": [
        "hey, madam, I'll keep an eye on you.",
        "No, it's just a dumb old skit from SNL",
        "I'm sick of your excuses, mister Arthur.",
        "you're gonna be sighing!"
    ],
    "macro-binary": [
        "Our project is called Marvin, and it has the latest advancements in ML.",
        "We show that using this new therapeutic technique called logotherapy, we got great results.",
        "In this competition, we got the highest accuracy."
    ]
}

var quillEditor = new Quill('#editor', {
    modules: {
        toolbar: [
            // [{ header: [1, 2, false] }],
            // [{ 'size': ['large', 'huge'] }],
            ['bold', 'italic', 'underline', 'code'],
            [{ 'color': [] }, { 'background': [] }, { 'font': [] }],
        ]
    },
    placeholder: 'Write away ...',
    theme: 'snow'
});


quillEditor.on('text-change', function (delta, oldDelta, source) {
    editorText = quillEditor.getText();
    $("#words").html(editorText.split(/[\w\d\’\'-]+/gi).length - 1);
});


// Init all sliders
displayExamples(quillEditor, examples, styleMode);


const formalitylabels = ['Informal', 'Neutral', 'Formal']
const emolabels = ['Sad', 'Neutral', 'Happy']
const pollabels = ['Rude', 'Neutral', 'Polite']
const shakelabels = ['Normal', 'Mid', 'High']
const binLabels = ['Wiki', 'Shakespeare', 'Abstract']

const sliderLabels = ['Very Low', 'Low', 'Mid', 'High', 'Very High'];

$('#formality-slider-micro-formality').slider({
    min: 0,
    max: 4,
    start: 0,
    step: 1,
    interpretLabel: function (value) {
        return sliderLabels[value];
    }
});

$('#formality-slider-micro-joint').slider({
    min: 0,
    max: 4,
    start: 0,
    step: 1,
    interpretLabel: function (value) {
        return sliderLabels[value];
    }
});
$('#emo-slider-micro-joint').slider({
    min: 0,
    max: 4,
    start: 0,
    step: 1,
    interpretLabel: function (value) {
        return sliderLabels[value];
    }
});
$('#politeness-slider-micro-joint').slider({
    min: 0,
    max: 4,
    start: 0,
    step: 1,
    interpretLabel: function (value) {
        return sliderLabels[value];
    }
});
$('#formality-input-slider-micro-joint').slider({
    min: 0,
    max: 4,
    start: 0,
    step: 1,
    interpretLabel: function (value) {
        return sliderLabels[value];
    }
});
$('#emo-input-slider-micro-joint').slider({
    min: 0,
    max: 4,
    start: 0,
    step: 1,
    interpretLabel: function (value) {
        return sliderLabels[value];
    }
});
$('#politeness-input-slider-micro-joint').slider({
    min: 0,
    max: 4,
    start: 0,
    step: 1,
    interpretLabel: function (value) {
        return sliderLabels[value];
    }
});

$('#shakespeare-slider-macro-shakespeare').slider({
    min: 0,
    max: 2,
    start: 0,
    step: 1,
    interpretLabel: function (value) {
        return shakelabels[value];
    }
});

$('#binary-slider').slider({
    min: 0,
    max: 2,
    start: 0,
    step: 1,
    interpretLabel: function (value) {
        return binLabels[value];
    }
});
$('input[data-style="none"]').checkbox('set checked');
$('.viz').click((e) => {
    console.log($(e.target).data('style'));
    attentionViz = $(e.target).data('style');
    $('.viz').removeClass('active');
    $(e.target).addClass('active')
});

$('.dropdown').dropdown({
    values: [
        // {
        //     name: 'Micro Styles (Formality)',
        //     value: 'micro-formality',
        //     selected: true

        // },
        {
            name: 'Micro Styles (Joint)',
            value: 'micro-joint',
            selected: true
        },
        // {
        //     name: 'Macro Styles (Shakespeare)',
        //     value: 'macro-shakespeare',
        // },
        // {
        //     name: 'Macro Styles (Binary)',
        //     value: 'macro-binary',
        // }
    ]
}).dropdown({
    onChange: function (value, text, $selectedItem) {
        console.log(value);
        styleMode = value;
        $('.preview-container').hide();
        if (styleMode === "micro-formality") {
            $('#preview-container-micro-formality').show();
        }
        else if (styleMode === "micro-joint") {
            $('#preview-container-micro-joint').show();
        }
        else if (styleMode === "macro-shakespeare") {
            $('#preview-container-macro-shakespeare').show();
        }
        else if (styleMode === "macro-binary") {
            $('#preview-container-macro-binary').show();
        }
        // $('#dimmer-model-swap').addClass('active');
        // console.log(styleMode);
        // $.ajax({
        //     url: 'http://0.0.0.0:5000/swap_models',
        //     method: "POST",
        //     crossDomain: true,
        //     dataType: 'json',
        //     data: { mode: styleMode },
        //     success: (d) => {
        //         console.log('models swapped!');
        //         $('#dimmer-model-swap').removeClass('active');
        //     },
        //     error: (d) => {
        //         console.log('ERROR! :(');
        //         $('#dimmer-model-swap').removeClass('active');
        //     }
        // });
        displayExamples(quillEditor, examples, styleMode);
    }
});

$('#checkbox-formality').checkbox({
    onChecked: function() {
        $('#form-sliders').show();
        // $('#formality-slider-micro-joint').show();
        // $('#formality-input-slider-micro-joint').show();
    },
    onUnchecked: function() {
        $('#form-sliders').hide();
        // $('#formality-slider-micro-joint').hide();
        // $('#formality-input-slider-micro-joint').hide();
    }
});
$('#checkbox-emotion').checkbox({
    onChecked: function() {
        $('#emo-sliders').show();
        // $('#emo-slider-micro-joint').show();
        // $('#emo-input-slider-micro-joint').show();
    },
    onUnchecked: function() {
        $('#emo-sliders').hide();
        // $('#emo-slider-micro-joint').hide();
        // $('#emo-input-slider-micro-joint').hide();
    }
});
$('#checkbox-politeness').checkbox({
    onChecked: function() {
        $('#pol-sliders').show();
        // $('#politeness-slider-micro-joint').show();
        // $('#politeness-input-slider-micro-joint').show();

    },
    onUnchecked: function() {
        $('#pol-sliders').hide();
        // $('#politeness-slider-micro-joint').hide();
        // $('#politeness-input-slider-micro-joint').hide();
    }
});

// $('#checkbox-politeness').click(() => {
//     console.log('clicked');
// })

$('.analyze').click(() => {
    let txt = editorText;
    let modeSelected = styleMode;
    console.log('lol');
    $.ajax({
        url: '/analyze',
        crossDomain: true,
        dataType: 'json',
        data: { text: txt, mode: modeSelected },
        success: (d) => {
            console.log(d);
            setProgress(d.results, modeSelected);
            displayJointHeatmap(d.results, attentionViz, quillEditor);

        }
    });
})



$('.transfer').click(() => {
    let txt = editorText;
    let modeSelected = styleMode;
    let controls = {}
    let styles = ''
    if (styleMode === "micro-formality") {
        controls = {
            formality: $('#formality-slider-micro-formality').slider('get value'),
            suggestions: $('#num-suggestions-micro-formality').val(),
        }
    }
    else if (styleMode === "micro-joint") {
        controls = {
            formality: $('#formality-slider-micro-joint').slider('get value'),
            emo: $('#emo-slider-micro-joint').slider('get value'),
            politeness: $('#politeness-slider-micro-joint').slider('get value'),
            formIn: $('#formality-input-slider-micro-joint').slider('get value'),
            emoIn: $('#emo-input-slider-micro-joint').slider('get value'),
            polIn: $('#politeness-input-slider-micro-joint').slider('get value'),
            // suggestions: $('#num-suggestions-micro-joint').val(),
            suggestions: 3,
        }
        let isPoliteness = $('#checkbox-politeness').checkbox('is checked');
        let isEmo = $('#checkbox-emotion').checkbox('is checked');
        let isFormality = $('#checkbox-formality').checkbox('is checked');
        // console.log('wtf')
        if (isPoliteness && isEmo) {
            styles = 'politeness_emo';
        } 
        else if (isPoliteness && isFormality) {
            styles = 'politeness_formality';
        } else {
            styles = 'formality_emo';
        }
    }
    else if (styleMode === "macro-shakespeare") {
        controls = {
            shakespeare: $('#shakespeare-slider-macro-shakespeare').slider('get value'),
            suggestions: $('#num-suggestions-macro-shakespeare').val(),
        }
    }
    else {
        controls = {
            macro: $('#binary-slider').slider('get value'),
            suggestions: $('#num-suggestions-macro-binary').val(),
        }
    }

    console.log('styles' + styles)
    console.log(JSON.stringify(controls));
    $.ajax({
        url: '/transfer',
        crossDomain: true,
        dataType: 'json',
        data: { text: txt, controls: JSON.stringify(controls), mode: modeSelected, style: styles },
        success: (d) => {
            console.log(d);
            let returnString = d['returned']
            console.log(returnString);
            console.log($('#transfer-results'));
            var constructedHtml = "<ol>";
            for(var i = 0; i < returnString.length; i++) {
                constructedHtml += "<li>" + returnString[i] + "</li>";
            }
            constructedHtml += "</ol>";
            $('#transfer-results').html(constructedHtml);
            // $('#transfer-results').html('<p>' + 
            // returnString + '</p>');
            // displayModal(d, styleMode);
            // function selectSuggestion() {
            //     let k = $(this).data('suggestion-id');
            //     // console.log(k, d.suggestions[k]);
            //     quillEditor.setContents([{ insert: d.suggestions[k].text }]);
            //     $('#transfer-suggestions')
            //         .modal('hide');
            //     console.log('Sending mysql request');
            //     $.ajax({
            //         url: '/transfer_action',
            //         method: "POST",
            //         crossDomain: true,
            //         dataType: 'json',
            //         data: {
            //             mode: modeSelected, goal: d.goal, original: d.input.text, original_val: JSON.stringify(d.input.probs),
            //             accepted: d.suggestions[k].text, accepted_val: JSON.stringify(d.suggestions[k].probs)
            //         },
            //         success: (d) => {
            //             console.log(d);
            //         },
            //     });
            // };
            // $('.suggestion-item').click(selectSuggestion);
            // $('#transfer-suggestions')
            //     .modal({
            //         onHide: function () {
            //             $('.suggestion-item').unbind('click', selectSuggestion);
            //         }
            //     })
            //     .modal('show');


        }
    });
})


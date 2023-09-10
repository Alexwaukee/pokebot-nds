const { ipcRenderer } = require('electron')
const YAML = require('yaml');

const configForm = document.getElementById('config-form');

const textAreas = [...configForm.getElementsByTagName('textarea')].map(ele => ele.id);
const fields = [...configForm.querySelectorAll('input[type="number"], select')].map(ele => ele.id);
const checkboxes = [...configForm.querySelectorAll('input[type="checkbox"]')].map(ele => ele.id);

var originalConfig = ''


function setBadgeClientCount(clients) {
    $('#home-button').empty()

    if (clients > 0) {
        $('#home-button').append('<span style="bottom:16px; right:-10px; font-size:10px" class="badge badge-primary position-absolute translate-middle text-bg-primary px-5">' + clients.toString() + '</span>')
    }
}

function sendConfig() {
    config = originalConfig

    try {
        for (var i = 0; i < textAreas.length; i++) {
            var key = textAreas[i]
            config[key] = YAML.parse($('#' + key).val())
        }
    }
    catch (e) {
        halfmoon.initStickyAlert({
            content: e,
            title: 'Changes not saved',
            alertType: 'alert-danger',
        })
        return
    }

    for (var i = 0; i < fields.length; i++) {
        field = fields[i]
        config[field] = $('#' + field).val()
    }

    for (var i = 0; i < checkboxes.length; i++) {
        field = checkboxes[i]
        config[field] = $('#' + field).prop('checked')
    }

    ipcRenderer.send('apply_config', config, $('#editing').val());

    halfmoon.initStickyAlert({
        content: 'You may need to restart pokebot-nds.lua for the bot mode to update immediately. Other changes will take effect now.',
        title: 'Changes saved!',
        alertType: 'alert-success',
    })

}

function updateOptionVisibility() {
    $('#option_starters').hide();
    $('#option_moving_encounters').hide();
    $('#option_auto_catch').hide();

    var mode = $('#mode').val();
    switch (mode) {
        case 'starters':
            $('#option_starters').show();
            break;
        case 'random encounters':
            $('#option_moving_encounters').show();
            break;
        case 'phenomenon encounters':
            $('#option_moving_encounters').show();
            break;
    }

    if ($('#auto_catch').prop('checked')) {
        $('#option_auto_catch').show();
    }
}

function setEditableGames(clients) {
    $('#editing').empty()
    $('#editing').append('<option value="all">All Games</option>')

    for (var i = 0; i < clients.length; i++) {
        var name = clients[i].game;

        $('#editing').append('<option value="' + i.toString() + '">' + name + ' </option>')
    }

    $('#editing').val('all')
}

// Hide values not relevant to the current bot mode
const form = document.querySelector('fieldset');
form.addEventListener('change', function () {
    updateOptionVisibility()
});

// Allow tab indentation in textareas
const textareas = document.getElementsByTagName('textarea');
const count = textareas.length;
for (var i = 0; i < count; i++) {
    textareas[i].onkeydown = function (e) {
        if (e.key == 'Tab') {
            e.preventDefault();
            var s = this.selectionStart;
            this.value = this.value.substring(0, this.selectionStart) + '  ' + this.value.substring(this.selectionEnd);
            this.selectionEnd = s + 2;
        }
    }
}

// Ctrl + S shortcut
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        sendConfig();
    }
});

ipcRenderer.on('set_config', (_event, config) => {
    originalConfig = config

    for (var i = 0; i < textAreas.length; i++) {
        var key = textAreas[i]
        $('#' + key).val(YAML.stringify(config[key]))
    }

    for (var i = 0; i < fields.length; i++) {
        field = fields[i]
        $('#' + field).val(config[field])
    }

    for (var i = 0; i < checkboxes.length; i++) {
        field = checkboxes[i]
        $('#' + field).prop('checked', config[field]);
    }

    $('#config-form').removeAttr('disabled')
    updateOptionVisibility()
});

ipcRenderer.on('set_page_icon', (_event, icon_src) => {
    document.getElementById('icon').src = icon_src
});

ipcRenderer.on('clients_updated', (_event, clients) => {
    setBadgeClientCount(clients.length);
    setEditableGames(clients)
});

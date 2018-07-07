var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;
	// super-constructor
	instance_skel.apply(this, arguments);
	self.togglePlayState = 1;
	self.actions(); // export actions
	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
};

instance.prototype.init = function() {
	var self = this;
	self.status(self.STATE_OK); // status ok!
	debug = self.debug;
	log = self.log;
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			tooltip: 'The IP of the X32 console',
			width: 6,
			regex: self.REGEX_IP
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;
	debug("destory", self.id);;
};

instance.prototype.fader_val = [
		{ label: '- ∞',         id: '0.0' },
		{ label: '-50 dB: ',   id: '0.1251' },
		{ label: '-30 dB',     id: '0.251' },
		{ label: '-20 dB',     id: '0.375' },
		{ label: '-18 dB',     id: '0.4' },
		{ label: '-15 dB',     id: '0.437' },
		{ label: '-12 dB',     id: '0.475' },
		{ label: '-9 dB',      id: '0.525' },
		{ label: '-6 dB',      id: '0.6' },
		{ label: '-3 dB',      id: '0.675' },
		{ label: '-2 dB',      id: '0.7' },
		{ label: '-1 dB',      id: '0.725' },
		{ label: '0 dB',       id: '0.75' },
		{ label: '+1 dB',      id: '0.775' },
		{ label: '+2 dB',      id: '0.8' },
		{ label: '+3 dB',      id: '0.825' },
		{ label: '+4 dB',      id: '0.85' },
		{ label: '+5 dB',      id: '0.875' },
		{ label: '+6 dB',      id: '0.9' },
		{ label: '+9 dB',      id: '0.975' },
		{ label: '+10 dB',     id: '1.0' }
];

instance.prototype.color_val = [
		{ label: 'Off',              id: '0' },
		{ label: 'Red: ',            id: '1' },
		{ label: 'Green',            id: '2' },
		{ label: 'Yellow',           id: '3' },
		{ label: 'Blue',             id: '4' },
		{ label: 'Magenta',          id: '5' },
		{ label: 'Cyan',             id: '6' },
		{ label: 'White',            id: '7' },
		{ label: 'Off Inverted',     id: '8' },
		{ label: 'Red Inverted',     id: '9' },
		{ label: 'Green Inverted',   id: '10' },
		{ label: 'Yellow Inverted',  id: '11' },
		{ label: 'Blue Inverted',    id: '12' },
		{ label: 'Magenta Inverted', id: '13' },
		{ label: 'Cyan Inverted',    id: '14' },
		{ label: 'White Inverted',   id: '15' }
];

instance.prototype.actions = function(system) {
	var self = this;
	self.system.emit('instance_actions', self.id, {

		'channel_mute':     {
			label:      'Set the channel mute',
			options: [
				{
				type:     'textinput',
				label:    'Channel number 01-32 ( use leading 0 on all single digit channels 01 ,02 ...)',
				id:       'channel',
				default:  '01',
				regex:    self.REGEX_NUMBER
				},
				{
				type:     'dropdown',
				label:    'Mute / Unmute',
				id:       'mute',
				choices:  [ { id: '0', label: 'Mute' }, { id: '1', label: 'Unmute' } ]
				}
			]
		},

		'channel_fad':     {
			label:      'Channel fader level',
			options: [
				{
				type:     'textinput',
				label:    'Channel number 01-32 (Use leading 0 on all single digit channels 01 ,02 ...)',
				id:       'channel',
				default:  '01',
				regex:    self.REGEX_NUMBER
				},
				{
				type:     'dropdown',
				label:    'Fader Level',
				id:       'fad',
				choices:  self.fader_val
				}
			]
		},

		'mute_grp':     {
			label:     'Mute Group ON/OFF',
			options: [
				{
				type:    'textinput',
				label:   'Mute Group Number (1-6)',
				id:      'mute_grp',
				default: '1',
				regex: self.REGEX_NUMBER
				},
				{
				type:    'dropdown',
				label:   'Mute / Unmute',
				id:      'mute',
				choices: [ { id: '1', label: 'Mute' }, { id: '0', label: 'Unmute' } ]
				}
			]
		},

		'channel_label':     {
			label:     'Set the channel label',
			options: [
				{
				type:    'textinput',
				label:   'Channel number 01-32 (Use leading 0 on all single digit channels 01 ,02 ...)',
				id:      'channel',
				default: '01',
				regex: self.REGEX_NUMBER
				},
				{
				type:    'textinput',
				label:   'Channel Label',
				id:      'ch_lab',
				default: ''
				}
			]
		},

		'channel_color':     {
			label:     'Set the channel color',
			options: [
				{
				type:    'textinput',
				label:   'Channel number 01-32 (Use leading 0 on all single digit channels 01 ,02 ...)',
				id:      'channel',
				default: '01',
				regex:   self.REGEX_NUMBER
				},
				{
				type:    'dropdown',
				label:   'Channel color',
				id:      'ch_col',
				choices: self.color_val
				}
			]
		},

		'go_cue':     {
			label:     'Load Console Cue',
			options: [
				{
				type:    'textinput',
				label:   'Cue Nr 0-99',
				id:      'cue',
				default: '0',
				regex:   self.REGEX_NUMBER
				}

			]
		},

		'go_scene':     {
			label:     'Load Console Scene',
			options: [
				{
				type:    'textinput',
				label:   'scene Nr 0-99',
				id:      'scene',
				default: '0',
				regex:   self.REGEX_NUMBER
				}

			]
		},

		'go_snip':     {
			label:     'Load Console snippet',
			options: [
				{
				type:    'textinput',
				label:   'Snippet Nr 0-99',
				id:      'snip',
				default: '0',
				regex:   self.REGEX_NUMBER
				}

			]
		},

	});
}

instance.prototype.action = function(action) {
	var self = this;
	var id = action.action;
	var cmd
	var opt = action.options


	switch (action.action){

		case 'mute_grp':
			var arg = {
				type: "i",
				value: opt.mute
			};
			self.system.emit('osc_send', self.config.host, 10023,'/config/mute/'+ opt.mute_grp  , [arg]);
		break;

		case 'channel_mute':
			var arg = {
				type: "i",
				value: opt.mute
			};
			self.system.emit('osc_send', self.config.host, 10023,'/ch/' + opt.channel + '/mix/on' ,[arg]);
		break;

		case 'channel_fad':
			var arg = {
				type: "f",
				value: parseFloat(opt.fad)
			};
			self.system.emit('osc_send', self.config.host, 10023,'/ch/' + opt.channel + '/mix/fader' ,[arg]);
		break;

		case 'channel_label':
			var arg = {
				type: "s",
				value: "" + opt.ch_lab
			};
			self.system.emit('osc_send', self.config.host, 10023,'/ch/' + opt.channel + '/config/name' ,[arg]);
		break;

		case 'channel_color':
		var arg = {
			type: "i",
			value: opt.ch_col
		};
		self.system.emit('osc_send', self.config.host, 10023,'/ch/' + opt.channel + '/config/color' ,[arg]);
		break;

		case 'go_cue':
			var arg = {
				type: "i",
				value: parseInt(opt.cue)
			};
		self.system.emit('osc_send', self.config.host, 10023,'/‐action/gocue'  ,[arg]);
		debug('/‐action/gocue', arg);
		break;

		case 'go_scene':
			var arg = {
				type: "i",
				value: parseInt(opt.scene)
			};
		self.system.emit('osc_send', self.config.host, 10023,'/-action/goscene'  ,[arg]);
		debug('/‐action/goscene', arg);
		break;

		case 'go_snip':
			var arg = {
				type: "i",
				value: parseInt(opt.snip)
			};
		self.system.emit('osc_send', self.config.host, 10023,'/‐action/gosnippet'  ,[arg]);
		debug ('/‐action/gosnippet', arg);
		break;
}




};

instance.module_info = {
	label: 'Behringer X32',
	id: 'x32',
	version: '0.0.1'
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;

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

instance.prototype.tape_func = [
		{ label: 'STOP',                id: '0' },
		{ label: 'PLAY PAUSE',          id: '1' },
		{ label: 'PLAY',                id: '2' },
		{ label: 'RECORD PAUSE',        id: '3' },
		{ label: 'RECORD',              id: '4' },
		{ label: 'FAST FORWARD',        id: '5' },
		{ label: 'REWIND',              id: '6' }
];

instance.prototype.actions = function(system) {
	var self = this;
	self.system.emit('instance_actions', self.id, {

		'mute':     {
			label:      'Set mute',
			options: [
				{
				type:     'dropdown',
				label:    'Type',
				id:       'type',
				choices:  [
					{ id: '/ch/',      label: 'Channel 01-32' },
					{ id: '/auxin/',   label: 'Aux In 01-08' },
					{ id: '/fxrtn/',   label: 'FX Return 01-08' },
					{ id: '/bus/',     label: 'Bus 01-16'  },
					{ id: '/mtx/',     label: 'Matrix 01-06' }
				 ]
				 },
				{
				type:     'textinput',
				label:    'Ch, AuxIn, FXrtn, Bus, Mtx Number ( use leading 0 on all single digit numbers 01 ,02 ...) ',
				id:       'num',
				default:  '01',
				regex:    self.REGEX_NUMBER
				},
				{
				type:     'dropdown',
				label:    'Mute / Unmute',
				id:       'mute',
				choices:  [ { id: '0', label: 'Mute' }, { id: '1', label: 'Unmute' } ]
				},
			]
		},
		'mMute':     {
			label:      'Set Main mute',
			options: [
				{
					type:     'dropdown',
					label:    'Type',
					id:       'type',
					choices:  [
						{ id: '/main/st',      label: 'Stereo' },
						{ id: '/main/m',       label: 'Mono' }
					 ]
				},
				{
					type:     'dropdown',
					label:    'Mute / Unmute',
					id:       'mute',
					choices:  [ { id: '0', label: 'Mute' }, { id: '1', label: 'Unmute' } ]
				},
			]
		},

		'fad':     {
			label:      'Set fader level',
			options: [
				{
				type:     'dropdown',
				label:    'Type',
				id:       'type',
				choices:  [
					{ id: '/ch/',      label: 'Channel 01-32' },
					{ id: '/auxin/',   label: 'Aux In 01-08' },
					{ id: '/fxrtn/',   label: 'FX Return 01-08' },
					{ id: '/bus/',     label: 'Bus 01-16'  },
					{ id: '/mtx/',     label: 'Matrix 01-06' }
				 ]
				 },
				{
				type:     'textinput',
				label:    'Ch, AuxIn, FXrtn, Bus, Mtx Number ( use leading 0 on all single digit numbers 01 ,02 ...)' ,
				id:       'num',
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

		'mFad':     {
			label:      'Set Main fader level',
			options: [
				{
				type:     'dropdown',
				label:    'Type',
				id:       'type',
				choices:  [
					{ id: '/main/st',      label: 'Stereo' },
					{ id: '/main/m',       label: 'Mono' }
				 ]
				 },
				{
				type:     'dropdown',
				label:    'Fader Level',
				id:       'fad',
				choices:  self.fader_val
				}
			]
		},

		'label':     {
			label:     'Set label',
			options: [
				{
				type:     'dropdown',
				label:    'Type',
				id:       'type',
				choices:  [
					{ id: '/ch/',      label: 'Channel 01-32' },
					{ id: '/auxin/',   label: 'Aux In 01-08' },
					{ id: '/fxrtn/',   label: 'FX Return 01-08' },
					{ id: '/bus/',     label: 'Bus 01-16'  },
					{ id: '/mtx/',     label: 'Matrix 01-06' }
				 ]
				 },
				{
				type:    'textinput',
				label:   'Ch, AuxIn, FXrtn, Bus, Mtx Number ( use leading 0 on all single digit numbers 01 ,02 ...)',
				id:      'num',
				default: '01',
				regex: self.REGEX_NUMBER
				},
				{
				type:    'textinput',
				label:   'Label',
				id:      'lab',
				default: ''
				}
			]
		},

		'mLabel':     {
			label:     'Set Main label',
			options: [
				{
				type:     'dropdown',
				label:    'Type',
				id:       'type',
				choices:  [
					{ id: '/main/st',      label: 'Stereo' },
					{ id: '/main/m',       label: 'Mono' }
				 ]
				 },
				{
				type:    'textinput',
				label:   'Label',
				id:      'lab',
				default: ''
				}
			]
		},

		'color':     {
			label:     'Set the color',
			options: [
				{
				type:     'dropdown',
				label:    'Type',
				id:       'type',
				choices:  [
					{ id: '/ch/',      label: 'Channel 01-32' },
					{ id: '/auxin/',   label: 'Aux In 01-08' },
					{ id: '/fxrtn/',   label: 'FX Return 01-08' },
					{ id: '/bus/',     label: 'Bus 01-16'  },
					{ id: '/mtx/',     label: 'Matrix 01-06' }
				 ]
				 },
				{
				type:    'textinput',
				label:   'Ch, AuxIn, FXrtn, Bus, Mtx Number ( use leading 0 on all single digit numbers 01 ,02 ...)',
				id:      'num',
				default: '01',
				regex:   self.REGEX_NUMBER
				},
				{
				type:    'dropdown',
				label:   'color',
				id:      'col',
				choices: self.color_val
				}
			]
		},

		'mColor':     {
			label:     'Set Main color',
			options: [
				{
				type:     'dropdown',
				label:    'Type',
				id:       'type',
				choices:  [
					{ id: '/main/st',      label: 'Stereo' },
					{ id: '/main/m',       label: 'Mono' }
				 ]
				 },
				{
				type:    'dropdown',
				label:   'color',
				id:      'col',
				choices: self.color_val
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

		'tape':     {
			label:     'Tape Operation',
			options: [

				{
				type:    'dropdown',
				label:   'Function',
				id:      'tFunc',
				choices: self.tape_func
				}
			]
		}

	});
}

instance.prototype.action = function(action) {
	var self = this;
	var id = action.action;
	var cmd
	var opt = action.options


	switch (action.action){



		case 'mute':
			var arg = {
				type: "i",
				value: opt.mute
			};
			cmd = opt.type + opt.num + '/mix/on';
		break;

		case 'mMute':
			var arg = {
				type: "i",
				value: opt.mute
			};
			cmd = opt.type + '/mix/on';
		break;

		case 'fad':
			var arg = {
				type: "f",
				value: parseFloat(opt.fad)
			};
			cmd = opt.type + opt.num + '/mix/fader';
		break;

		case 'mFad':
			var arg = {
				type: "f",
				value: parseFloat(opt.fad)
			};
			cmd = opt.type + '/mix/fader';
		break;

		case 'label':
			var arg = {
				type: "s",
				value: "" + opt.lab
			};
			cmd = opt.type + opt.num + '/config/name';
		break;

		case 'mLabel':
			var arg = {
				type: "s",
				value: "" + opt.lab
			};
			cmd = opt.type + '/config/name';
		break;

		case 'color':
		var arg = {
			type: "i",
			value: opt.col
		};
		cmd = opt.type + opt.num + '/config/color';

		break;

		case 'mColor':
		var arg = {
			type: "i",
			value: opt.col
		};
		cmd = opt.type + '/config/color';
		break;

		case 'mute_grp':
			var arg = {
				type: "i",
				value: opt.mute
			};
			cmd = '/config/mute/'+ opt.mute_grp;
		break;

		case 'go_cue':
			var arg = {
				type: "i",
				value: parseInt(opt.cue)
			};
			cmd = '/‐action/gocue';
		break;

		case 'go_scene':
			var arg = {
				type: "i",
				value: parseInt(opt.scene)
			};
			cmd = '/-action/goscene';
		break;

		case 'go_snip':
			var arg = {
				type: "i",
				value: parseInt(opt.snip)
			};
			cmd = '/‐action/gosnippet';
		break;

		case 'tape':
			var arg = {
				type: "i",
				value: parseInt(opt.tFunc)
			};
			cmd = '/-stat/tape/state'
		break;
}
	if (cmd !== undefined) {
		self.system.emit('osc_send', self.config.host, 10023,cmd  ,[arg]);
		debug (cmd, arg);
	}

};

instance.module_info = {
	label: 'Midas M32 / Behringer X32',
	id: 'x32',
	version: '0.0.1'
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;

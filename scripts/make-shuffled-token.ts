// scripts/make-shuffled-token.ts（Nodeで実行）
// Requirement: tsx or Node.js >= v23.6.0

import { parseArgs } from 'node:util';
import { buildPermutation ,fnv1a32,inversePermutation } from '../src/lib/obfuscation';

const help =`## Description
This tool is an obfuscation tool designed to counter bot token crawling.

## Requirement
- tsx or Node.js >= v23.6.0

## USAGE
  
  # Obfuscation with seed number.
  $ tsx scripts/make-shuffled-token.ts --seed 2718281828 --token 'pk.xxxxx...yyyy'

  # Obfuscation with seed word.
  $ tsx scripts/make-shuffled-token.ts --seed-word 'who bar buzz' --token 'pk.xxxxx...yyyy'

  # restore mode --decode,-d
  $ tsx scripts/make-shuffled-token.ts --seed-word 'who bar buzz' --token 'xxyxy..yy.yx' -d
`;

const { values: opts }  = parseArgs(
	{
		args: process.argv.slice(2),
		options:
		{
			'token':
			{
				type: 'string',
				short: 't'
			},
			'seed-word':
			{
				type: 'string',
			},
			'seed':
			{
				type: 'string',
			},
			'decode':
			{
				type: 'boolean',
				default: false,
				short: 'd'
			}
		},
		allowPositionals: false,
		allowNegative: false
	}
);

const decideSeed = ():number | undefined =>
{
	if( opts.seed != undefined )
	{
		return Number.parseInt( opts.seed, 10 ); // 整数値に変換できるか確認
	}
	else if( typeof opts['seed-word'] ==='string' && opts['seed-word'].length )
	{
		return fnv1a32( opts['seed-word'] ?? '' );
	}
	else
	{
		console.error('Either seed or seed-word must be specified');
		throw new Error( help );
	}
}

if( opts.token == undefined )
{
	console.error('TOKEN is required');
	throw new Error( help );
}

const token = opts.token;
const seed = decideSeed();

if( seed === undefined )
{
	console.error('invalid seed');
	throw new Error( help );
}

const p = buildPermutation(token.length, seed);


if( ! opts.decode)
{
	const shuffled = p.map(i => token[i]).join('');
	// 出力：.env.production に貼る
	console.log(`TOKEN_SHUF='${shuffled}'`);
	console.log(`SEED=${seed}`);
	if( opts['seed-word'] )
	{
		console.log(`SEED_WORD=${opts['seed-word']}`);
	}
}
else
{
	const shuffled = token;
	const inv = inversePermutation(p);
	const buffer = new Array<string>(shuffled.length);
	for (let i = 0; i < inv.length; i++)
	{
		buffer[i] = shuffled[inv[i]];
	}
	const decoded = buffer.join('');

	console.log(`DECODED='${decoded}'`);
	console.log(`SEED=${seed}`);
}

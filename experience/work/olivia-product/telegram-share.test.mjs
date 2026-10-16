import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {telegramShareText,telegramShareUrl,canShareInTelegram} from './telegram-share.js';

const {oliviaLaunchTarget}=createRequire(import.meta.url)('../../telegram/launch.js');
const parts=url=>{const parsed=new URL(url);return {origin:parsed.origin+parsed.pathname,link:parsed.searchParams.get('url'),text:parsed.searchParams.get('text')};};

test('the message names only the card, in the page language', () => {
 assert.equal(telegramShareText(17,{locale:'en',today:true}),'My card today: The Star. Olivia turns each card into three questions.');
 assert.equal(telegramShareText(17,{locale:'uk',today:true}),'Моя карта дня — Зірка. Olivia перетворює кожну карту на три запитання.');
 assert.equal(telegramShareText(0,{locale:'en'}),'My card: The Fool. Olivia turns each card into three questions.');
 assert.equal(telegramShareText(22,{locale:'uk'}),'Моя карта — Туз Жезлів. Olivia перетворює кожну карту на три запитання.');
});

test('the share sheet link opens that card in the Mini App', () => {
 const {origin,link,text}=parts(telegramShareUrl(77,{locale:'en'}));
 assert.equal(origin,'https://t.me/share/url');
 assert.equal(link,'https://t.me/OliviaArcanaBot?startapp=card_77');
 assert.equal(text,'My card: King of Pentacles. Olivia turns each card into three questions.');
 const start=new URL(link).searchParams.get('startapp');
 assert.equal(decodeURIComponent(oliviaLaunchTarget('?tgWebAppStartParam='+start,'','en').split('?r=')[1]),'spreads/card-77');
 assert.match(telegramShareUrl(17,{locale:'uk',today:true}),/^https:\/\/t\.me\/share\/url\?url=https%3A%2F%2Ft\.me%2FOliviaArcanaBot%3Fstartapp%3Dcard_17&text=%D0%9C/);
});

test('only a real card can be shared', () => {
 for(const id of [-1,78,1.5,'17',null,undefined])assert.throws(()=>telegramShareUrl(id,{locale:'en'}),TypeError,String(id));
});

test('Telegram sharing needs the Mini App and a client from 6.1', () => {
 const client=version=>({isVersionAtLeast:v=>Number(v)<=version});
 assert.equal(canShareInTelegram({OLIVIA_TELEGRAM:true,Telegram:{WebApp:client(7.0)}}),true);
 assert.equal(canShareInTelegram({OLIVIA_TELEGRAM:true,Telegram:{WebApp:client(6.0)}}),false);
 assert.equal(canShareInTelegram({Telegram:{WebApp:client(8.0)}}),false);
 assert.equal(canShareInTelegram({OLIVIA_TELEGRAM:true}),false);
 assert.equal(canShareInTelegram(undefined),false);
});


import yargs from 'yargs';
import pkg from '../package.json';
import o from './logWebUi';
import {ipfsInit, pubsubInit} from './ipfsInit';
import {blockMgr as BlockMgr} from '../shared';
import {handleProccessedTxs} from './handleProcessedTxs';
import {handlePendingTxs} from './handlePendingTxs';
import events from 'events';
import ComputeTaskPeersMgr from './nodeSimComputeTaskPeersMgr.js';

exports.startApp = async (OPTIONS)=>{ 
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|")
  o('log', "|____________________________________________")
  o('log', 'options:', OPTIONS);

  ipfsInit(OPTIONS.swarm)
  .then((ipfs)=>{
    const blockMgr = new BlockMgr(ipfs)
    blockMgr.registerNewBlockEventHandler(async (args)=>{
      await handleProccessedTxs(args)
    });
    blockMgr.registerNewBlockEventHandler(async (args)=>{
      await handlePendingTxs(args)
    });
    blockMgr.registerNewBlockEventHandler(({height, cid})=>{
      o('log', '------------------------------------------')
      o('log', '|');
      o('log', `|      ${global.userInfo?global.userInfo.userName : "UserNameNotAssignedYet"} -- ${global.ipfs._peerInfo.id.toB58String()} receives new block,`, {height});
      o('log', '|');
      o('log', '------------------------------------------')
    })
    
    global.ipfs = ipfs;
    global.blockMgr = blockMgr;
    global.rpcEvent = new events.EventEmitter();
    global.broadcastEvent = new events.EventEmitter();
    global.nodeSimCache = {
      computeTaskPeersMgr: new ComputeTaskPeersMgr(ipfs)
    };
    global.allPeers = {};
    
    return pubsubInit(ipfs, OPTIONS.randRoomPostfix, global.rpcEvent, global.broadcastEvent,  global.logEvent);
  })
  .then(({townHall})=>{
    global.log = (type, content)=>{
      if(! global.webUiPeerId){
        return;
      }
      townHall.sendTo(global.webUiPeerId, JSON.stringify({type, content}));
      
    }
    console.log('pubsubInit done');
  })
  .catch(err=>{
    console.log('error in promises,', err);
  });
}

exports.getOptions = ()=>{
  const OPTIONS = {};
  let argv = yargs
    .version(pkg.version)
    .usage(`Usage: $0 -u user#`)
    .boolean([
      'hacked'
    ])
    .option('swarm', {
      alias:[
        's',
      ],
      description:'Local, default or an IPFS swarm URL',
      type:'string',
      default:'/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
      //default:'/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star',
    })
    .options('randRoomPostfix', {
      alias:[
        'r',
      ],
      description:'Specify a random string as pub sub room name postfix.',
      type:'string',
      default:''
    })
    .option('hacked', {
      alias: [
        'h',
      ],
      description: 'Force this node perform as a hacked node',
      type: 'boolean',
    })
    .option('user', {
      alias: [
        'u',
      ],
      description: 'Node user name',
      type: 'string',
      //demand: true,
    })
    .alias('h', 'help')
    .help('h', 'Show help.')
    .argv;

  OPTIONS.user = argv.user;
  OPTIONS.swarm = argv.swarm;
  OPTIONS.randRoomPostfix = argv.randRoomPostfix;
  OPTIONS.hacked = argv.hacked;
  OPTIONS.leader = argv.leader;
  OPTIONS.port = argv.port;

  return OPTIONS;
}



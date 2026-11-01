const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const React = require('react'), swc = require('next/dist/build/swc'), { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}) {
  const { code } = swc.transformSync(fs.readFileSync(path.join(root,file),'utf8'), { filename:file, jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'} });
  const mod = { exports:{} }; vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})(id=>mocks[id]||require(id),mod,mod.exports);return mod.exports;
}
const helpers = load('lib/sample-images.js');
const fixture = { title:'Five views', slug:'five-views', prompt:'Shared context', samplePromptMode:'per-image', sampleCoverId:'three', sampleImages:Array.from({length:5},(_,i)=>({id:['one','two','three','four','five'][i],value:`https://example.com/${i}.png`,caption:`View ${i+1}`,instructions:`Instructions ${i+1}`})) };
test('gallery helpers retain order, legacy fallback and compose each selected prompt',()=>{
  assert.equal(helpers.getCoverIndex(fixture),2);
  assert.deepEqual(helpers.getSampleImages(fixture).map(i=>i.id),['one','two','three','four','five']);
  assert.equal(helpers.imagePromptText(fixture,fixture.sampleImages[4],4),'Shared context\n\nIMAGE 5 — View 5\n\nInstructions 5');
  assert.equal(helpers.imagePromptText({...fixture,samplePromptMode:'single'},fixture.sampleImages[0],0),'');
  assert.equal(helpers.getSampleImages({title:'Old',sampleOutput:{type:'image',value:'https://example.com/old.png'}})[0].id,'legacy-sample');
  assert.equal(helpers.getSampleImages({sampleOutput:{type:'video',value:'https://example.com/old.mp4'}}).length,0);
});
const mocks = { '@/lib/sample-images':helpers,'./protected-media':{ProtectedImage:({cloudinaryOptions,widths,...props})=>React.createElement('img',props)},'./PromptAccessLink':{PromptAccessLink:props=>React.createElement('a',props)},'./CopyButton':{CopyButton:({text})=>React.createElement('button',{'data-copy':text},'Copy')} };
test('Discover collage uses the selected cover, four previews and a remaining-image badge',()=>{
  const {SampleCollage}=load('components/sample-image-gallery.jsx',mocks);
  const html=renderToStaticMarkup(React.createElement(SampleCollage,{prompt:fixture}));
  assert.match(html,/\+1 more/);assert.match(html,/5 images/);assert.match(html,/Set/);
  assert.ok(html.indexOf('https://example.com/2.png')<html.indexOf('https://example.com/0.png'));
  assert.equal(html.includes('Instructions 1'),false);
});
test('detail gallery starts at cover and shows only the selected image prompt',()=>{
  const {SampleImageGallery}=load('components/sample-image-gallery.jsx',mocks);
  const html=renderToStaticMarkup(React.createElement(SampleImageGallery,{prompt:fixture}));
  assert.match(html,/Sample 3 of 5/); assert.match(html,/Instructions 3/); assert.equal(html.includes('Instructions 1'),false);
  assert.match(html,/Show sample 5/); assert.match(html,/Expand sample 3/);
});

(function(){
  var body=document.body;
  var langButtons=document.querySelectorAll('[data-lang-button],#langToggle button');
  function setLanguage(lang){
    body.setAttribute('data-lang',lang);
    document.documentElement.lang=lang;
    langButtons.forEach(function(button){
      var value=button.getAttribute('data-lang-button')||button.getAttribute('data-lang');
      button.classList.toggle('active',value===lang);
      button.classList.toggle('on',value===lang);
    });
    try{localStorage.setItem('vm-v2-lang',lang)}catch(error){}
  }
  var saved='ru';
  try{saved=localStorage.getItem('vm-v2-lang')||'ru'}catch(error){}
  setLanguage(saved==='en'?'en':'ru');
  langButtons.forEach(function(button){button.addEventListener('click',function(){setLanguage(button.getAttribute('data-lang-button')||button.getAttribute('data-lang'))})});

  var header=document.querySelector('.site-header');
  function paintHeader(){if(header)header.classList.toggle('scrolled',window.scrollY>8)}
  paintHeader();
  window.addEventListener('scroll',paintHeader,{passive:true});

  var revealItems=document.querySelectorAll('.project-card,.concept-card,.experience-list article,.case-fig,.case h2,.case h3');
  if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    revealItems.forEach(function(item){item.classList.add('visible')});
  }else{
    revealItems.forEach(function(item){item.classList.add('reveal')});
    var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}})},{threshold:.08,rootMargin:'0px 0px -5%'});
    revealItems.forEach(function(item){observer.observe(item)});
  }

  document.querySelectorAll('[data-slider]').forEach(function(slider){
    var track=slider.querySelector('.slides');
    if(!track||!track.children.length)return;
    var index=0,count=track.children.length,dots=slider.querySelector('.lightbox-dots');
    function go(next){index=(next+count)%count;track.style.transform='translateX(-'+index*100+'%)';if(dots)Array.from(dots.children).forEach(function(dot,i){dot.classList.toggle('active',i===index)})}
    if(dots){for(var i=0;i<count;i++){(function(n){var dot=document.createElement('button');dot.className='lightbox-dot';dot.type='button';dot.setAttribute('aria-label','Slide '+(n+1));dot.addEventListener('click',function(){go(n)});dots.appendChild(dot)})(i)}}
    var previous=slider.querySelector('.prev'),next=slider.querySelector('.next');
    if(previous)previous.addEventListener('click',function(){go(index-1)});if(next)next.addEventListener('click',function(){go(index+1)});go(0);
  });

  var legacyThemeButton=document.getElementById('themeToggle');
  if(legacyThemeButton)legacyThemeButton.style.display='none';
})();

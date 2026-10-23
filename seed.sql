INSERT OR IGNORE INTO pages (id,slug,kind,parent_id,nav_order,is_core,is_trashed,draft_json,published_json) VALUES 
  ('home','accueil','home',NULL,0,1,0,'{"title":"NADÈGE RENARD","subtitle":"scénographe/peintre","cover":"","blocks":[{"type":"image","src":"","alt":""},{"type":"label","text":"MA VISION"},{"type":"text","text":""}]}','{"title":"NADÈGE RENARD","subtitle":"scénographe/peintre","cover":"","blocks":[{"type":"image","src":"","alt":""},{"type":"label","text":"MA VISION"},{"type":"text","text":""}]}'),
  ('bio','bio','page',NULL,1,0,0,'{"title":"BIO","subtitle":"","cover":"","blocks":[]}','{"title":"BIO","subtitle":"","cover":"","blocks":[]}'),
  ('sceno','scenographie-spectacle','gallery',NULL,2,0,0,'{"title":"SCÉNOGRAPHIE SPECTACLE","subtitle":"","cover":"","blocks":[]}','{"title":"SCÉNOGRAPHIE SPECTACLE","subtitle":"","cover":"","blocks":[]}'),
  ('transmission','transmission-workshop','gallery',NULL,3,0,0,'{"title":"TRANSMISSION WORKSHOP","subtitle":"","cover":"","blocks":[]}','{"title":"TRANSMISSION WORKSHOP","subtitle":"","cover":"","blocks":[]}'),
  ('patines','patines-et-couleurs','gallery',NULL,4,0,0,'{"title":"PATINES ET COULEURS","subtitle":"","cover":"","blocks":[]}','{"title":"PATINES ET COULEURS","subtitle":"","cover":"","blocks":[]}'),
  ('manipulation','manipulation-spectacle','gallery',NULL,5,0,0,'{"title":"MANIPULATION SPECTACLE","subtitle":"","cover":"","blocks":[]}','{"title":"MANIPULATION SPECTACLE","subtitle":"","cover":"","blocks":[]}'),
  ('presse','presse','press',NULL,6,0,0,'{"title":"PRESSE","subtitle":"","cover":"","blocks":[]}','{"title":"PRESSE","subtitle":"","cover":"","blocks":[]}'),
  ('contact','contact','contact',NULL,7,1,0,'{"title":"CONTACT","subtitle":"","cover":"","blocks":[]}','{"title":"CONTACT","subtitle":"","cover":"","blocks":[]}')
;

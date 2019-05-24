/* eslint-disable strict */
module.exports = {
  "agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
  "formDataPost": {
    "source": 8,
    "upload_id": 1024,
    "waterfallxapp": "web_react_composer"
  },
  "groups": "https://www.facebook.com/groups/?category=groups",
  "linkUploadImage": ( token, id, av ) => {
    return `https://upload.facebook.com/ajax/react_composer/attachments/photo/upload?av=${av}&__user=${id}&__a=1&fb_dtsg=${token}`;
  },
  "linkGetAllFriends": ( token, id ) => {
    return `https://www.facebook.com/ajax/typeahead/first_degree.php?fb_dtsg_ag=${token}&viewer=${id}&filter[0]=user&options[0]=friends_only&__user=${id}&__a=1`;
  },
  "linkGetPreviewScrape": ( id, scrapeLink ) => {
    return `https://www.facebook.com/react_composer/scraper/?composer_id=rc.u_0_13&target_id=${id}&scrape_url=${scrapeLink}&entry_point=feedx_sprouts&source_attachment=STATUS&source_logging_name=link_pasted&av=${id}`;
  },
  "linkUploadFeed":
    "https://www.facebook.com/webgraphql/mutation/?doc_id=1740513229408093",
  "linkGetIdPost": ( av ) => {
    return `https://www.facebook.com/async/publisher/creation-hooks/?av=${av}`;
  },
  "linkGetActionTypeLoader": ( token, id ) => {
    return `https://www.facebook.com/ajax/metacomposer/attachment/og/typeahead/bootstrap/action_type_loader?fb_dtsg_ag=${token}&rank_verbs=false&viewer=${id}&__user=${id}&__a=1`;
  },
  "linkGetItemActionTypeLoader": ( token, id, item ) => {
    return `https://www.facebook.com/ajax/metacomposer/attachment/og/typeahead/query/object_loader?at_id=${item}&fb_dtsg_ag=${token}&viewer=${id}&__user=${id}&__a=1`;
  },
  "linkSearchPlaces": ( id, token, value, limit ) => {
    if ( value === null ) {
      return `https://www.facebook.com/ajax/places/typeahead?limit=${limit}&fb_dtsg_ag=${token}&__user=${id}&include_likes=false&include_subtext=true&include_address=1&exact_match=false&use_unicorn=true&allow_places=true&allow_cities=true&use_searchable_entries=true&caller_platform=FB_COMPOSER_CHECKIN&hide_geo=false&__a=1`;
    }
    return `https://www.facebook.com/ajax/places/typeahead?value=${value}&limit=${limit}&fb_dtsg_ag=${token}&__user=${id}&include_likes=false&include_subtext=true&include_address=1&exact_match=false&use_unicorn=true&allow_places=true&allow_cities=true&use_searchable_entries=true&caller_platform=FB_COMPOSER_CHECKIN&hide_geo=false&__a=1`;
  },
  "mpost": ( id ) => {
    return `https://m.facebook.com/${id}`;
  },
  "pages": "https://www.facebook.com/unified_nav/pages_menu_items",
  "postsSearch": ( keyword, token, page ) => {
    return `https://m.facebook.com/graphsearch/str/${encodeURI(
      keyword
    )}/stories-keyword/stories-feed?fb_dtsg_ag=${encodeURI( token )}&pn=${page}`;
  },
  "post": ( id ) => {
    return `https://www.facebook.com/${id}`;
  },
  "scrapeSharePost": {
    "group": 37,
    "strange": 22,
    "shareother": 3,
    "video": 22,
    "threater": 37,
    "shareprofile": 1,
    "youtubelink": 100
  },
  /**
   * Link GrapQL
   */
  "linkgraphfacebook": "https://www.facebook.com/api/graphql"
};

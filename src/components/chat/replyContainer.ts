import appImManager, { CHAT_ANIMATION_GROUP } from "../../lib/appManagers/appImManager";
import appPhotosManager from "../../lib/appManagers/appPhotosManager";
import { RichTextProcessor } from "../../lib/richtextprocessor";
import DivAndCaption from "../divAndCaption";
import { renderImageFromUrl } from "../misc";
import { wrapSticker } from "../wrappers";

export default class ReplyContainer extends DivAndCaption<(title: string, subtitle: string, message?: any) => void> {
  private mediaEl: HTMLElement;

  constructor(protected className: string) {
    super(className, (title: string, subtitle: string = '', message?: any) => {
      if(title.length > 150) {
        title = title.substr(0, 140) + '...';
      }
    
      if(subtitle.length > 150) {
        subtitle = subtitle.substr(0, 140) + '...';
      }
      
      title = title ? RichTextProcessor.wrapEmojiText(title) : '';

      if(this.mediaEl) {
        this.mediaEl.remove();
        this.container.classList.remove('is-media');
      }

      const media = message && message.media;
      if(media) {
        subtitle = message.rReply;
    
        //console.log('wrap reply', media);
        
        if(media.photo || (media.document && ['video', 'sticker'].indexOf(media.document.type) !== -1)) {
          const replyMedia = document.createElement('div');
          replyMedia.classList.add(this.className + '-media');

          if(media.document?.type == 'sticker') {
            wrapSticker({
              doc: media.document,
              div: replyMedia,
              lazyLoadQueue: appImManager.lazyLoadQueue,
              group: CHAT_ANIMATION_GROUP,
              onlyThumb: media.document.sticker == 2,
              width: 32,
              height: 32
            });
          } else {
            const photo = media.photo || media.document;

            if(photo._ == 'document' || !photo.downloaded) {
              const sizes = photo.sizes || photo.thumbs;
              if(sizes && sizes[0].bytes) {
                appPhotosManager.setAttachmentPreview(sizes[0].bytes, replyMedia, false, true);
              }
            }

            const size = appPhotosManager.choosePhotoSize(photo, 32, 32/* mediaSizes.active.regular.width, mediaSizes.active.regular.height */);
            appPhotosManager.preloadPhoto(photo, size)
            .then(() => {
              renderImageFromUrl(replyMedia, photo._ == 'photo' ? photo.url : appPhotosManager.getDocumentCachedThumb(photo.id).url);
            });
          }

          this.content.prepend(this.mediaEl = replyMedia);
          this.container.classList.add('is-media');
        }
      } else {
        subtitle = subtitle ? RichTextProcessor.wrapEmojiText(subtitle) : '';
      }
  
      this.title.innerHTML = title;
      this.subtitle.innerHTML = subtitle;
    });
  }
}
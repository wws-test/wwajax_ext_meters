
// 导出一个异步函数popupWindow，接收一个参数对象{ url: string }
export const popupWindow = async ({ url } : { url: string }) => {
  // 判断浏览器是否支持documentPictureInPicture
  if (!('documentPictureInPicture' in window)) {
    // 如果不支持，弹出提示框
    alert('Your browser does not currently support documentPictureInPicture. You can go to chrome://flags/#document-picture-in-picture-api to enable it.');
    return;
  }
  // 请求打开一个picture-in-picture窗口，返回一个Promise对象
  // @ts-ignore
  const pipWindow = await documentPictureInPicture.requestWindow({ width: 580, height: 680 });
  // 创建一个iframe元素
  const iframe = document.createElement('iframe');
  // 设置iframe的src属性为传入的url
  iframe.src = url;
  // 设置iframe的className为'ajax-interceptor-iframe'
  iframe.className = 'ajax-interceptor-iframe';
  // 设置iframe的宽度为100%
  iframe.style.setProperty('width', '100%');
  // 设置iframe的高度为100%
  iframe.style.setProperty('height', '100%');
  // 设置iframe的边框为none
  iframe.style.setProperty('border', 'none');
  // 设置picture-in-picture窗口的body的margin为0
  pipWindow.document.body.style.setProperty('margin', '0');
  // 将iframe添加到picture-in-picture窗口的body中
  pipWindow.document.body.append(iframe);
  // 返回picture-in-picture窗口对象
  return pipWindow;
};
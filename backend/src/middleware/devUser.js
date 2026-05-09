module.exports = function devUser(req, res, next) {
  req.user = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'dev@reelmind.local',
  };
  next();
};

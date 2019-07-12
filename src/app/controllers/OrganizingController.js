import Meetup from '../models/Meetup';
import File from '../models/File';

class OrganizingController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: {
        user_id: req.userId
      },
      attributes: ['id', 'title', 'description', 'date_hour', 'localization'],
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'url', 'name', 'path']
        }
      ]
    });

    return res.json(meetups);
  }
}

export default new OrganizingController();
